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

  export let opened: boolean;
  export let item: KnownPlace | null = null;
  export let initialLatitude: number | null = null;
  export let initialLongitude: number | null = null;
  export let onSaved: ((place: KnownPlace) => void) | null = null;

  let name = item?.name ?? '';
  let latitude = `${item?.latitude ?? initialLatitude ?? ''}`;
  let longitude = `${item?.longitude ?? initialLongitude ?? ''}`;

  const detectLocation = () => {
    if (typeof window === 'undefined' || !window.navigator.geolocation) {
      showErrorToast($translate('transactions.geolocation_not_supported'));
      return;
    }
    window.navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        latitude = `${coords.latitude}`;
        longitude = `${coords.longitude}`;
      },
      () => showErrorToast($translate('transactions.geolocation_failed')),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    const latitudeNumber = Number(latitude);
    const longitudeNumber = Number(longitude);
    if (
      !name.trim() ||
      !Number.isFinite(latitudeNumber) ||
      !Number.isFinite(longitudeNumber) ||
      latitudeNumber < -90 ||
      latitudeNumber > 90 ||
      longitudeNumber < -180 ||
      longitudeNumber > 180
    ) {
      return;
    }

    const place: KnownPlace = {
      id: item?.id ?? uuid(),
      name: name.trim(),
      latitude: latitudeNumber,
      longitude: longitudeNumber,
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

<Modal header={$translate(item ? 'known_places.edit' : 'known_places.new')} bind:opened width={22}>
  <form class="flex-col gap-1" on:submit|preventDefault={save}>
    <Input label={$translate('known_places.name')} bind:value={name} required />
    <Input
      label={$translate('known_places.latitude')}
      bind:value={latitude}
      type="number"
      inputmode="decimal"
      min="-90"
      max="90"
      step="any"
      required
    />
    <Input
      label={$translate('known_places.longitude')}
      bind:value={longitude}
      type="number"
      inputmode="decimal"
      min="-180"
      max="180"
      step="any"
      required
    />
    <Button appearance="link" underlined={false} onClick={detectLocation}>
      <span class="flex items-center gap-0.5">
        <Icon name="mdi:crosshairs-gps" />
        {$translate('transactions.detect_geolocation')}
      </span>
    </Button>
    <div class="grid-col-2 gap-1">
      {#if item}
        <Button onClick={remove} text={$translate('common.delete')} color="danger" />
      {:else}
        <Button onClick={() => (opened = false)} text={$translate('common.cancel')} color="secondary" />
      {/if}
      <Button text={$translate('common.save')} color="primary" type="submit" />
    </div>
  </form>
</Modal>
