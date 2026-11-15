<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { translate } from '#lib/translate/index.js';

  export let onCreate: () => void = () => {};
</script>

<div class="flex">
  <button
    type="button"
    on:click={onCreate}
    data-testId="RecordDebt"
    aria-label={$translate('debts.add_entry')}
    title={$translate('debts.add_entry')}
  >
    <Icon name="mdi:plus" padding={1} />
  </button>
</div>

<style>
  button {
    display: inline-flex;
    align-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--active-color);
    cursor: pointer;
  }
</style>
