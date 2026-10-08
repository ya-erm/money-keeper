<script lang="ts">
  import { onMount } from 'svelte';
  import type { Map, Marker } from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import { showErrorToast, showSuccessToast } from '@ya-erm/svelte-ui/toasts';
  import type { KnownPlace } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import type { Messages } from '$lib/translate/messages';
  import { handleError } from '$lib/utils';
  import SubScreen from '$lib/ui/layout/SubScreen.svelte';
  import { isValidCoordinates, type Coordinates } from '$lib/utils/geolocation';

  export let initialPosition: Coordinates | null = null;
  export let currentPosition: Coordinates | null = null;
  export let places: KnownPlace[] = [];
  export let initialName = '';
  export let nameRequired = false;
  export let confirmLabel: Messages = 'common.done';
  export let onSelect: (position: Coordinates, name: string) => void | Promise<void>;
  export let onLocated: ((position: Coordinates) => void) | null = null;
  export let onRemove: (() => void | Promise<void>) | null = null;
  export let onClose: () => void;

  let container: HTMLDivElement;
  let map: Map | null = null;
  let marker: Marker | null = null;
  let selectedPosition =
    initialPosition && isValidCoordinates(initialPosition.latitude, initialPosition.longitude) ? initialPosition : null;
  let ready = false;
  let failed = false;
  let locating = false;
  let name = initialName;
  let submitting = false;
  let deleteConfirmationOpened = false;
  let disposed = false;
  let selectionRevision = 0;
  let selectPosition: ((position: Coordinates) => void) | null = null;
  $: canSave = ready && !!selectedPosition && !submitting && (!nameRequired || !!name.trim());

  const locate = (automatic = false) => {
    if (!navigator.geolocation) {
      if (!automatic) showErrorToast($translate('transactions.geolocation_not_supported'));
      return;
    }
    const revision = selectionRevision;
    locating = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (disposed) return;
        const position = { latitude: coords.latitude, longitude: coords.longitude };
        onLocated?.(position);
        if (revision === selectionRevision) {
          selectPosition?.(position);
          map?.setView([position.latitude, position.longitude], 17);
        }
        locating = false;
      },
      () => {
        if (disposed) return;
        locating = false;
        if (!automatic) showErrorToast($translate('transactions.geolocation_failed'));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    if (!selectedPosition || submitting || (nameRequired && !name.trim())) return;
    submitting = true;
    try {
      await onSelect(selectedPosition, name.trim());
    } catch (error) {
      handleError(error);
    } finally {
      submitting = false;
    }
  };
  const remove = async () => {
    if (!onRemove || submitting) return;
    submitting = true;
    try {
      await onRemove();
      deleteConfirmationOpened = false;
    } catch (error) {
      handleError(error);
    } finally {
      submitting = false;
    }
  };
  const copyCoordinates = async () => {
    if (!selectedPosition) return;
    try {
      await navigator.clipboard.writeText(`${selectedPosition.latitude}, ${selectedPosition.longitude}`);
      showSuccessToast($translate('transactions.coordinates_copied'));
    } catch {
      showErrorToast($translate('transactions.coordinates_copy_failed'));
    }
  };

  onMount(() => {
    let resizeObserver: ResizeObserver | null = null;
    const initialize = async () => {
      try {
        const leaflet = await import('leaflet');
        if (disposed) return;
        const savedPosition = places.find((place) => isValidCoordinates(place.latitude, place.longitude));
        const center = selectedPosition ?? currentPosition ?? savedPosition ?? { latitude: 0, longitude: 0 };
        map = leaflet.map(container, { worldCopyJump: true, maxZoom: 19 });
        map.attributionControl.setPrefix(false);
        map.setView([center.latitude, center.longitude], selectedPosition || currentPosition || savedPosition ? 16 : 2);
        leaflet
          .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          })
          .on('tileerror', () => (failed = true))
          .on('tileload', () => (failed = false))
          .addTo(map);
        const icon = leaflet.divIcon({
          className: 'location-pin',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        selectPosition = (position) => {
          if (!map || !isValidCoordinates(position.latitude, position.longitude)) return;
          selectionRevision++;
          selectedPosition = position;
          if (marker) {
            marker.setLatLng([position.latitude, position.longitude]);
          } else {
            marker = leaflet
              .marker([position.latitude, position.longitude], {
                icon,
                draggable: true,
                title: $translate('transactions.selected_location'),
              })
              .addTo(map);
            marker.on('dragend', () => {
              const point = marker?.getLatLng().wrap();
              if (point) selectPosition?.({ latitude: point.lat, longitude: point.lng });
            });
          }
        };
        map.on('click', (event) => {
          const point = event.latlng.wrap();
          selectPosition?.({ latitude: point.lat, longitude: point.lng });
        });
        map.on('keydown', (event) => {
          if (event.originalEvent.key === 'Enter') {
            const point = map?.getCenter().wrap();
            if (point) selectPosition?.({ latitude: point.lat, longitude: point.lng });
          }
        });
        for (const place of places) {
          if (!isValidCoordinates(place.latitude, place.longitude)) continue;
          const label = document.createElement('span');
          label.textContent = place.name;
          leaflet
            .circleMarker([place.latitude, place.longitude], {
              radius: 7,
              color: '#5299d2',
              fillOpacity: 0.5,
            })
            .bindTooltip(label)
            .on('click', (event) => {
              leaflet.DomEvent.stopPropagation(event);
              selectPosition?.({ latitude: place.latitude, longitude: place.longitude });
            })
            .addTo(map);
        }
        if (selectedPosition) selectPosition(selectedPosition);
        else if (currentPosition && isValidCoordinates(currentPosition.latitude, currentPosition.longitude))
          selectPosition(currentPosition);
        else locate(true);
        resizeObserver = new ResizeObserver(() => map?.invalidateSize());
        resizeObserver.observe(container);
        ready = true;
      } catch {
        failed = true;
      }
    };
    void initialize();
    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      map?.remove();
      map = null;
      selectPosition = null;
    };
  });
</script>

<SubScreen
  visible={true}
  title={$translate('transactions.location_editor')}
  onBack={onClose}
  rightSlot={Button}
  rightSlotProps={{
    text: $translate('common.done'),
    appearance: 'transparent',
    underlined: false,
    onClick: save,
    disabled: !canSave,
    testId: 'LocationDoneButton',
  }}
  testId="LocationPicker"
>
  <form class="picker" on:submit|preventDefault={save}>
    <div class="map-frame">
      <div
        class="map"
        role="region"
        bind:this={container}
        data-testId="LocationMap"
        aria-label={$translate('transactions.choose_on_map')}
      ></div>
      <button
        type="button"
        class="gps"
        on:click={() => locate()}
        disabled={!ready || locating || submitting}
        aria-busy={locating}
        aria-label={$translate('transactions.current_location')}
        title={$translate('transactions.current_location')}
        data-testId="LocateOnMapButton"><Icon name="mdi:crosshairs-gps" size={1.25} /></button
      >
    </div>
    {#if failed}
      <p role="alert">{$translate('transactions.map_failed')}</p>
    {:else if !ready}
      <p>{$translate('common.loading')}</p>
    {/if}
    {#if selectedPosition}
      <div class="coordinate-row">
        <button
          type="button"
          class="coordinates"
          on:click={copyCoordinates}
          title={$translate('transactions.copy_coordinates')}
          aria-label={$translate('transactions.copy_coordinates')}
          data-testId="LocationCoordinates"
        >
          {$translate('transactions.coordinates')}: ({selectedPosition.latitude.toFixed(4)}, {selectedPosition.longitude.toFixed(
            4,
          )})
        </button>
        <a
          class="external-map"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedPosition.latitude},${selectedPosition.longitude}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          title={$translate('transactions.open_in_google_maps')}
          aria-label={$translate('transactions.open_in_google_maps')}
          data-testId="OpenExternalMapLink"
        >
          {$translate('common.open')} <span aria-hidden="true"><Icon name="mdi:open-in-new" size={1} /></span>
        </a>
      </div>
    {/if}
    <Input
      label={$translate('known_places.name')}
      bind:value={name}
      required={nameRequired}
      testId="LocationNameInput"
    />
    <div class="picker-actions">
      <Button type="submit" disabled={!canSave} testId="ConfirmLocationButton">
        {$translate(confirmLabel)}
      </Button>
      {#if onRemove}<Button
          color="danger"
          appearance="link"
          onClick={() => (deleteConfirmationOpened = true)}
          disabled={submitting}
          testId="DeleteKnownPlaceButton">{$translate('common.delete')}</Button
        >{/if}
    </div>
  </form>
</SubScreen>

<Modal bind:opened={deleteConfirmationOpened} header={$translate('known_places.delete')} width={25}>
  <div class="flex-col gap-1">
    <p class="m-0">{$translate('known_places.delete_confirm', { values: { name: initialName } })}</p>
    <Button color="danger" onClick={remove} disabled={submitting} testId="ConfirmDeleteKnownPlaceButton"
      >{$translate('common.delete')}</Button
    >
    <Button color="white" bordered onClick={() => (deleteConfirmationOpened = false)} disabled={submitting}
      >{$translate('common.cancel')}</Button
    >
  </div>
</Modal>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .map-frame {
    position: relative;
  }
  .gps {
    position: absolute;
    right: 0.75rem;
    bottom: 2rem;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--header-background-color);
    color: var(--active-color);
    cursor: pointer;
  }
  .gps:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .coordinate-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: -0.5rem 0;
  }
  .coordinates {
    flex: 1;
    min-width: 0;
    text-align: left;
    padding: 0;
    min-height: 2.75rem;
    border: 0;
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .external-map {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
    min-height: 2.75rem;
    color: var(--active-color);
    text-decoration: none;
  }
  .external-map span {
    display: flex;
  }
  .map {
    height: clamp(14rem, 42vh, 26rem);
    border-radius: 0.75rem;
    background: #e5e5e5;
    z-index: 0;
  }
  .picker-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .picker-actions > :global(button) {
    width: 100%;
  }
  .map :global(.location-pin) {
    background: var(--active-color);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 1px 5px #0008;
  }
</style>
