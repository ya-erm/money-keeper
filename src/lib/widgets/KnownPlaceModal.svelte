<script lang="ts">
  import { v4 as uuid } from 'uuid';
  import { membersService, memberSettingsStore } from '$lib/data';
  import type { KnownPlace } from '$lib/data/interfaces';
  import type { Coordinates } from '$lib/utils/geolocation';
  import LocationPicker from './LocationPicker.svelte';

  export let opened: boolean;
  export let item: KnownPlace | null = null;

  const save = async (position: Coordinates, name: string) => {
    const place: KnownPlace = { id: item?.id ?? uuid(), name, ...position };
    const places = membersService.selectedMemberSettings?.knownPlaces ?? [];
    await membersService.updateKnownPlaces(
      item ? places.map((value) => (value.id === item?.id ? place : value)) : [...places, place],
    );
    opened = false;
  };
  const remove = async () => {
    if (!item) return;
    const places = membersService.selectedMemberSettings?.knownPlaces ?? [];
    await membersService.updateKnownPlaces(places.filter((place) => place.id !== item?.id));
    opened = false;
  };
</script>

{#if opened}
  <LocationPicker
    initialPosition={item ? { latitude: item.latitude, longitude: item.longitude } : null}
    initialName={item?.name ?? ''}
    nameRequired
    confirmLabel="common.save"
    places={$memberSettingsStore?.knownPlaces ?? []}
    onSelect={save}
    onRemove={item ? remove : null}
    onClose={() => (opened = false)}
  />
{/if}
