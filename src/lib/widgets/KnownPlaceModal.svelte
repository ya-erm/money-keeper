<script lang="ts">
  import { v4 as uuid } from 'uuid';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';

  import { membersService } from '$lib/data';
  import type { KnownPlace } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';
  import { isValidCoordinates, type Coordinates } from '$lib/utils/geolocation';
  import LocationPicker from './LocationPicker.svelte';

  export let opened: boolean;
  export let item: KnownPlace | null = null;
  export let initialLatitude: number | null = null;
  export let initialLongitude: number | null = null;
  export let onSaved: ((place: KnownPlace) => void) | null = null;

  let name = item?.name ?? '';
  const latitude = item?.latitude ?? initialLatitude;
  const longitude = item?.longitude ?? initialLongitude;
  let position: Coordinates | null =
    latitude !== null && longitude !== null && isValidCoordinates(latitude, longitude) ? { latitude, longitude } : null;
  let locationPickerOpened = false;
  let locating = false;

  const selectLocation = (value: Coordinates) => {
    position = value;
    locationPickerOpened = false;
  };

  const detectLocation = () => {
    if (typeof window === 'undefined' || !window.navigator.geolocation) {
      showErrorToast($translate('transactions.geolocation_not_supported'));
      return;
    }
    locating = true;
    window.navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        position = { latitude: coords.latitude, longitude: coords.longitude };
        locating = false;
      },
      () => {
        locating = false;
        showErrorToast($translate('transactions.geolocation_failed'));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    if (!name.trim() || !position || !isValidCoordinates(position.latitude, position.longitude)) {
      return;
    }

    const place: KnownPlace = {
      id: item?.id ?? uuid(),
      name: name.trim(),
      ...position,
    };
    const places = membersService.selectedMemberSettings?.knownPlaces ?? [];
    const nextPlaces = item
      ? places.map((placeItem) => (placeItem.id === item?.id ? place : placeItem))
      : [...places, place];

    await membersService.updateKnownPlaces(nextPlaces);
    onSaved?.(place);
    opened = false;
  };

  const remove = async () => {
    if (!item) return;
    const places = membersService.selectedMemberSettings?.knownPlaces ?? [];
    await membersService.updateKnownPlaces(places.filter((place) => place.id !== item?.id));
    opened = false;
  };
</script>

{#if locationPickerOpened}
  <LocationPicker
    initialPosition={position}
    places={membersService.selectedMemberSettings?.knownPlaces ?? []}
    onSelect={selectLocation}
    onClose={() => (locationPickerOpened = false)}
  />
{:else}
  <Modal header={$translate(item ? 'known_places.edit' : 'known_places.new')} bind:opened width={22}>
    <form class="flex-col gap-1" on:submit|preventDefault={save}>
      <Input label={$translate('known_places.name')} bind:value={name} required />
      <p class="location-status" role="status">
        {$translate(position ? 'known_places.location_selected' : 'known_places.location_required')}
      </p>
      <Button color="white" bordered onClick={detectLocation} disabled={locating}>
        <span class="flex items-center gap-0.5">
          <Icon name="mdi:crosshairs-gps" />
          {locating ? $translate('common.loading') : $translate('transactions.detect_geolocation')}
        </span>
      </Button>
      <Button color="white" bordered onClick={() => (locationPickerOpened = true)} disabled={locating}>
        <span class="flex items-center gap-0.5">
          <Icon name="mdi:map-outline" />
          {$translate('transactions.open_geolocation')}
        </span>
      </Button>
      <div class="grid-col-2 gap-1">
        {#if item}
          <Button onClick={remove} text={$translate('common.delete')} color="danger" />
        {:else}
          <Button onClick={() => (opened = false)} text={$translate('common.cancel')} color="secondary" />
        {/if}
        <Button text={$translate('common.save')} color="primary" type="submit" disabled={!position || locating} />
      </div>
    </form>
  </Modal>
{/if}

<style>
  .location-status {
    margin: 0;
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
</style>
