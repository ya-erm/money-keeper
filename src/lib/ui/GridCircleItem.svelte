<script lang="ts">
  import Icon from '$lib/ui/Icon.svelte';

  export let icon: string;
  export let text: string | null = null;
  export let onClick: (() => void) | null = null;
  export let selected: boolean = false;
  export let testId: string | undefined = undefined;
  export let dataId: string | undefined = undefined;
  export let dashed: boolean = false;
</script>

<button
  on:click={onClick}
  class:clickable={!!onClick}
  class:selected
  class:dashed
  data-testId={testId}
  data-id={dataId}
  disabled={!onClick}
  class="grid-item w-full flex-col flex-center gap-0.5"
  type="button"
>
  <div class="circle">
    <div class="circle-icon">
      <Icon name={icon} size={2} />
    </div>
  </div>
  {#if text}
    <span class="text" title={text}>
      {text}
    </span>
  {/if}
</button>

<style>
  .grid-item {
    padding: 0;
    border: none;
    outline: none;
    background: none;
    color: var(--primary-text-color);
    text-decoration: none;
  }
  .grid-item:focus,
  .grid-item.selected {
    color: var(--active-color);
  }
  .grid-item.clickable {
    cursor: pointer;
  }
  @media (hover: hover) {
    .grid-item.clickable:hover {
      color: var(--active-color);
    }
  }
  .grid-item .text {
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: calc(100% + 0.5rem);
  }
  .grid-item.dashed .text {
    color: var(--active-color);
  }
  .grid-item .circle {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    outline: none;
    border: 1px solid var(--border-color);
    border-radius: 100%;
    width: 4rem;
    height: 4rem;
    background: var(--header-background-color);
  }
  .circle-icon {
    pointer-events: none;
  }
  .grid-item.dashed .circle {
    border-style: dashed;
    background-color: transparent;
    border-color: var(--active-color);
    color: var(--active-color);
  }
  .grid-item:focus .circle,
  .grid-item.selected .circle {
    border: 2px solid var(--active-color);
  }
  @media (hover: hover) {
    .grid-item.clickable:hover .circle {
      border: 2px solid var(--active-color);
    }
  }
</style>
