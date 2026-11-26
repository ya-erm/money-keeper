<script lang="ts">
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  import { translate } from '#lib/translate/index.js';
</script>

<div class="flex">
  <HeaderButton icon="mdi:format-list-bulleted" label={$translate('wallets.list')} href="/wallets/list" />
  <HeaderButton icon="mdi:wallet-plus-outline" label={$translate('wallets.new')} href="/wallets/create" />
</div>
