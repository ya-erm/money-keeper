<script lang="ts">
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';

  export let hidden: boolean;
  export let withoutText: boolean = false;
</script>

<button
  class="spoiler-toggle flex gap-1 items-center justify-between"
  on:click={() => (hidden = !hidden)}
  type="button"
>
  <h3 class="m-0 font-normal">
    <slot />
  </h3>
  <div class="flex items-center">
    {#if !withoutText}
      <span>{$translate(hidden ? 'common.show' : 'common.hide')}</span>
    {/if}
    <div class="spoiler-toggle-icon" class:shown={!hidden}>
      <Icon padding={0} name={'mdi:chevron-down'} />
    </div>
  </div>
</button>

<style>
  .spoiler-toggle {
    border: none;
    background: none;
    color: var(--primary-text-color);
    font-weight: normal;
    cursor: pointer;
    width: 100%;
    padding: 0;
  }
  .spoiler-toggle:hover {
    color: var(--active-color);
  }
  .spoiler-toggle-icon {
    transition: transform var(--duration, 0.5s);
  }
  .spoiler-toggle-icon.shown {
    transform: scaleY(-1);
  }
</style>
