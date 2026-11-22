<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import type { VirtualWallet } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import Modal from '#lib/ui/Modal.svelte';

  export let wallet: VirtualWallet;
  export let from: 'settings' | 'wallets' = 'wallets';
  let opened = false;
</script>

<button
  class="options"
  type="button"
  aria-label={$translate('common.additional_options')}
  on:click={() => (opened = true)}
>
  <Icon name="mdi:dots-vertical" padding={0.5} />
</button>
<Modal bind:opened width={16} header={$translate('common.additional_options')}>
  <div class="flex-col gap-1" data-testId="WalletOptions">
    <Button
      bordered
      color="white"
      onClick={() => {
        opened = false;
        void goto(`/wallets/edit?id=${encodeURIComponent(wallet.id)}&from=${from}`);
      }}
    >
      <span class="option-label"><Icon name="mdi:pencil" /><span>{$translate('common.edit')}</span></span>
    </Button>
    <Button color="secondary" bordered onClick={() => (opened = false)}>{$translate('common.cancel')}</Button>
  </div>
</Modal>

<style>
  .options {
    border: 0;
    background: transparent;
    color: var(--primary-text-color);
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
  }
  .option-label {
    width: 100%;
    display: grid;
    grid-template-columns: 1.5rem 1fr;
    align-items: center;
    gap: 0.75rem;
    text-align: left;
  }
</style>
