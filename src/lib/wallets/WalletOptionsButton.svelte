<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import type { VirtualWallet } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  export let wallet: VirtualWallet;
  export let from: 'settings' | 'wallets' = 'wallets';
</script>

<button
  class="options"
  type="button"
  aria-label={$translate('wallets.edit_wallet')}
  on:click={() => goto(`/wallets/edit?id=${encodeURIComponent(wallet.id)}&from=${from}`)}
>
  <Icon name="mdi:dots-vertical" padding={0.5} />
</button>

<style>
  .options {
    border: 0;
    background: transparent;
    color: var(--primary-text-color);
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
  }
</style>
