<script lang="ts">
  import Icon from '$lib/ui/Icon.svelte';

  export let icon: string;
  export let text: string;
  export let onClick: () => void;
  export let selected: boolean = false;
  export let testId: string | undefined = undefined;
  export let dataId: string | undefined = undefined;
  export let dashed: boolean = false;
</script>

<button
  on:click={onClick}
  class:selected
  class:dashed
  data-testId={testId}
  data-id={dataId}
  class="grid-item flex-col flex-center gap-0.5 cursor-pointer"
  type="button"
>
  <div class="circle">
    <Icon name={icon} size={2} />
  </div>
  <span class="text" title={text}>
    {text}
  </span>
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
  @media (hover: hover) {
    .grid-item:hover {
      color: var(--active-color);
    }
  }
  .grid-item .text {
    font-size: 0.8rem;
    max-width: 5rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
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
    border: 2px solid var(--border-color);
    border-radius: 100%;
    width: 4rem;
    height: 4rem;
    background: var(--header-background-color);
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
    .grid-item:hover .circle {
      border: 2px solid var(--active-color);
    }
  }
</style>
