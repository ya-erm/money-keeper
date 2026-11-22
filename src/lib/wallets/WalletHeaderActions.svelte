<script lang="ts">
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  import { translate } from '#lib/translate/index.js';
</script>

<div class="flex">
  <HeaderButton icon="mdi:format-list-bulleted" label={$translate('wallets.setup')} href="/settings/wallets" />
  <HeaderButton
    icon="mdi:wallet-plus-outline"
    label={$translate('wallets.new')}
    href="/settings/wallets?action=create"
  />
</div>
