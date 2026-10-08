<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';

  import { memberSettingsStore } from '$lib/data';
  import type { KnownPlace } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import KnownPlaceModal from '$lib/widgets/KnownPlaceModal.svelte';

  $: places = [...($memberSettingsStore?.knownPlaces ?? [])].sort((a, b) => a.name.localeCompare(b.name));

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
            <b>{place.name}</b>
            <span>{place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}</span>
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
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    padding: 1rem;
    text-align: left;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    cursor: pointer;
  }
  .place-card span {
    color: var(--secondary-text-color);
    font-size: 0.9em;
  }
</style>
