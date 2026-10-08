<script lang="ts">
  import { tick } from 'svelte';
  import { v4 as uuid } from 'uuid';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import type { KnownPlace } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import type { Coordinates } from '$lib/utils/geolocation';

  export let places: KnownPlace[];
  export let nearby: KnownPlace[];
  export let selected: KnownPlace | null;
  export let position: Coordinates | null;
  export let onSelect: (place: KnownPlace | null) => void;
  export let onAdd: () => void;

  const menuId = `places-${uuid()}`;
  let opened = false;
  let above = false;
  let root: HTMLDivElement;
  let trigger: HTMLButtonElement;
  let menu: HTMLDivElement;
  $: others = places.filter((place) => !nearby.some((item) => item.id === place.id));
  $: coordinates = position ? `(${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)})` : '';
  $: label = selected?.name ?? $translate(position ? 'transactions.map_point' : 'transactions.location_not_selected');

  const close = () => {
    opened = false;
    trigger?.focus();
  };
  const choose = (place: KnownPlace | null) => {
    onSelect(place);
    close();
  };
  const open = () => {
    const bounds = root.getBoundingClientRect();
    above = window.innerHeight - bounds.bottom < 240 && bounds.top > window.innerHeight - bounds.bottom;
    opened = true;
  };
  const openFromKeyboard = async (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    open();
    await tick();
    const options = menu.querySelectorAll<HTMLButtonElement>('button');
    options[event.key === 'ArrowDown' ? 0 : options.length - 1]?.focus();
  };
  const navigate = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const options = [...menu.querySelectorAll<HTMLButtonElement>('button')];
      const index = options.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? options.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[next]?.focus();
    } else if (event.key === 'Tab') opened = false;
  };
</script>

<svelte:window
  on:pointerdown={(event) => {
    if (!root?.contains(event.target as Node)) opened = false;
  }}
/>

<div class="selector" bind:this={root}>
  <button
    class="trigger"
    type="button"
    bind:this={trigger}
    aria-label={$translate('transactions.known_place')}
    aria-haspopup="menu"
    aria-expanded={opened}
    aria-controls={opened ? menuId : undefined}
    title={`${label}${position && !selected ? ` ${coordinates}` : ''}`}
    on:click={() => {
      if (opened) opened = false;
      else open();
    }}
    on:keydown={openFromKeyboard}
    data-testId="KnownPlaceSelect"
  >
    <span class="value">
      <span class="name" class:point={position && !selected}>{label}</span>
      {#if position && !selected}<span class="coordinates">{coordinates}</span>{/if}
    </span>
    <span class="chevron" aria-hidden="true"><Icon name="mdi:chevron-right" /></span>
  </button>
  {#if opened}
    <div
      class="options"
      class:above
      role="menu"
      tabindex="-1"
      aria-label={$translate('transactions.known_place')}
      id={menuId}
      bind:this={menu}
      on:keydown={navigate}
      data-testId="KnownPlaceOptions"
    >
      <button type="button" role="menuitem" on:click={() => choose(null)}
        >{$translate('transactions.location_not_selected')}</button
      >
      {#if position && !selected}
        <button type="button" role="menuitem" on:click={close}
          >{$translate('transactions.map_point')} <span class="coordinates">{coordinates}</span></button
        >
      {/if}
      {#each [{ label: 'transactions.nearby_places' as const, places: nearby }, { label: 'settings.known_places' as const, places: others }] as group (group.label)}
        {#if group.places.length}
          <div role="group" aria-label={$translate(group.label)}>
            <div class="group-label" aria-hidden="true">{$translate(group.label)}</div>
            {#each group.places as place (place.id)}
              <button type="button" role="menuitem" on:click={() => choose(place)}>{place.name}</button>
            {/each}
          </div>
        {/if}
      {/each}
      <button
        type="button"
        role="menuitem"
        class="add"
        on:click={() => {
          close();
          onAdd();
        }}><Icon name="mdi:plus" /> {$translate('common.add')}</button
      >
    </div>
  {/if}
</div>

<style>
  .selector {
    position: relative;
    min-width: 0;
    flex: 1;
  }
  .trigger {
    width: 100%;
    min-width: 0;
    height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;
    font: inherit;
    text-align: left;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    cursor: pointer;
  }
  .value {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
    overflow: hidden;
  }
  .name,
  .coordinates {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .name.point {
    flex-shrink: 0;
  }
  .coordinates {
    color: var(--secondary-text-color);
    font-size: 0.85em;
    min-width: 0;
  }
  .chevron {
    display: flex;
    flex-shrink: 0;
    transform: rotate(90deg);
  }
  .options {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    width: 100%;
    min-width: 0;
    max-height: min(22rem, 50vh);
    overflow-y: auto;
    z-index: 10;
    padding: 0.25rem;
    background: var(--header-background-color);
    color: var(--primary-text-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    box-shadow: 0 0.25rem 0.75rem #0002;
  }
  .options button {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem;
    text-align: left;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: 0.25rem;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .options.above {
    top: auto;
    bottom: calc(100% + 0.25rem);
  }
  .options button:hover,
  .options button:focus-visible {
    background: var(--hover-background-color);
  }
  .group-label {
    font-size: 1em;
    font-weight: 600;
    color: var(--primary-text-color);
    padding: 0.5rem;
  }
  .options .add {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--active-color);
  }
</style>
