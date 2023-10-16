<script lang="ts">
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';

  export let hidden: boolean;
  export let futureOperationsCount: number;
</script>

<button class="future-operations-button flex gap-1 items-center justify-between" on:click={() => (hidden = !hidden)}>
  <h3 class="m-0 font-normal">
    <span>{$translate('transactions.feature_operations')}</span>
    <span class="operations-count">
      {$translate('common.count', { values: { count: futureOperationsCount } })}
    </span>
  </h3>
  <div class="flex items-center">
    <span>{$translate(hidden ? 'common.show' : 'common.hide')}</span>
    <div class="future-operations-button-icon" class:shown={!hidden}>
      <Icon padding={0} name={'mdi:chevron-down'} />
    </div>
  </div>
</button>

<style>
  .future-operations-button {
    border: none;
    background: none;
    color: var(--primary-text-color);
    font-weight: normal;
    cursor: pointer;
    width: 100%;
    padding: 0;
  }
  .future-operations-button:hover {
    color: var(--active-color);
  }
  .future-operations-button-icon {
    transition: transform var(--duration, 0.5s);
  }
  .future-operations-button-icon.shown {
    transform: scaleY(-1);
  }
  .operations-count {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
</style>
