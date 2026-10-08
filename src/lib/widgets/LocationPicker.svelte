<script lang="ts">
  import { onMount } from 'svelte';
  import type { Map, Marker } from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import type { KnownPlace } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import SubScreen from '$lib/ui/layout/SubScreen.svelte';
  import { isValidCoordinates, type Coordinates } from '$lib/utils/geolocation';

  export let initialPosition: Coordinates | null = null;
  export let currentPosition: Coordinates | null = null;
  export let places: KnownPlace[] = [];
  export let onSelect: (position: Coordinates) => void;
  export let onLocated: ((position: Coordinates) => void) | null = null;
  export let onClose: () => void;

  let container: HTMLDivElement;
  let map: Map | null = null;
  let marker: Marker | null = null;
  let selectedPosition =
    initialPosition && isValidCoordinates(initialPosition.latitude, initialPosition.longitude) ? initialPosition : null;
  let ready = false;
  let failed = false;
  let locating = false;
  let selectPosition: ((position: Coordinates) => void) | null = null;

  const locate = () => {
    if (!navigator.geolocation) {
      showErrorToast($translate('transactions.geolocation_not_supported'));
      return;
    }
    locating = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { latitude: coords.latitude, longitude: coords.longitude };
        onLocated?.(position);
        selectPosition?.(position);
        map?.setView([position.latitude, position.longitude], 17);
        locating = false;
      },
      () => {
        locating = false;
        showErrorToast($translate('transactions.geolocation_failed'));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  onMount(() => {
    let disposed = false;
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

<SubScreen visible={true} title={$translate('transactions.choose_on_map')} onBack={onClose} testId="LocationPicker">
  <div class="picker">
    <p class="hint">{$translate('transactions.map_hint')}</p>
    <div
      class="map"
      role="region"
      bind:this={container}
      data-testId="LocationMap"
      aria-label={$translate('transactions.choose_on_map')}
    ></div>
    {#if failed}
      <p role="alert">{$translate('transactions.map_failed')}</p>
    {:else if !ready}
      <p>{$translate('common.loading')}</p>
    {/if}
    <div class="picker-actions">
      <Button color="white" bordered onClick={locate} disabled={!ready || locating}>
        <Icon name="mdi:crosshairs-gps" size={1.25} />
        {locating ? $translate('common.loading') : $translate('transactions.detect_geolocation')}
      </Button>
      <Button
        onClick={() => selectedPosition && onSelect(selectedPosition)}
        disabled={!ready || !selectedPosition}
        testId="ConfirmLocationButton"
      >
        {$translate('common.select')}
      </Button>
    </div>
  </div>
</SubScreen>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .hint {
    margin: 0;
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
  .map {
    height: clamp(16rem, 55vh, 30rem);
    border-radius: 0.75rem;
    background: #e5e5e5;
    z-index: 0;
  }
  .picker-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .picker-actions > :global(button) {
    flex: 1;
  }
  .map :global(.location-pin) {
    background: var(--active-color);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 1px 5px #0008;
  }
</style>
