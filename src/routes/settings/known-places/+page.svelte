<script lang="ts">
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import Button from '@ya-erm/svelte-ui/Button';

  import { memberSettingsStore } from '$lib/data';
  import { operationsStore } from '$lib/data/operations';
  import type { KnownPlace } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import KnownPlaceModal from '$lib/widgets/KnownPlaceModal.svelte';
  import { findNearbyPlaces } from '$lib/utils/geolocation';

  $: places = [...($memberSettingsStore?.knownPlaces ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  $: operationCounts = (() => {
    const counts = new SvelteMap<string, number>();
    const counted = new SvelteSet<string>();
    for (const operation of $operationsStore) {
      if (operation.locationLat == null || operation.locationLng == null) continue;
      const place = findNearbyPlaces({ latitude: operation.locationLat, longitude: operation.locationLng }, places)[0];
      if (!place) continue;
      const key = operation.linkedTransactionId
        ? [operation.id, operation.linkedTransactionId].sort().join(':')
        : operation.id;
      if (counted.has(key)) continue;
      counted.add(key);
      counts.set(place.id, (counts.get(place.id) ?? 0) + 1);
    }
    return counts;
  })();

  let opened = false;
  let selectedPlace: KnownPlace | null = null;

  const editPlace = (place: KnownPlace) => {
    selectedPlace = place;
    opened = true;
  };

  const addPlace = () => {
    selectedPlace = null;
    opened = true;
  };
</script>

<Layout title={$translate('settings.known_places')} leftSlot={HeaderBackButton}>
  <div class="flex-col gap-1 p-1">
    <p class="description">{$translate('known_places.description')}</p>
    <Button onClick={addPlace} color="primary">{$translate('known_places.add')}</Button>
    {#if places.length === 0}
      <p class="empty">{$translate('known_places.empty')}</p>
    {:else}
      <div class="flex-col gap-0.5">
        {#each places as place (place.id)}
          <button class="place-card" on:click={() => editPlace(place)} on:keypress={() => {}}>
            <div class="place-details">
              <b>{place.name}</b>
              <span>{place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}</span>
            </div>
            <span class="operation-count" data-testId="KnownPlaceOperationCount"
              >{$translate('known_places.operations_count', {
                values: { count: operationCounts.get(place.id) ?? 0 },
              })}</span
            >
          </button>
        {/each}
      </div>
    {/if}
  </div>
</Layout>

{#if opened}
  <KnownPlaceModal bind:opened item={selectedPlace} />
{/if}

<style>
  .description,
  .empty {
    margin: 0;
    color: var(--secondary-text-color);
  }
  .place-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    padding: 1rem;
    text-align: left;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    cursor: pointer;
  }
  .place-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .operation-count {
    flex-shrink: 0;
    text-align: right;
  }
  .place-card span {
    color: var(--secondary-text-color);
    font-size: 0.9em;
  }
</style>
