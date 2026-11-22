<script lang="ts">
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  import { translate } from '#lib/translate/index.js';
</script>

<HeaderButton icon="mdi:format-list-bulleted" label={$translate('wallets.setup')} href="/settings/wallets" />
