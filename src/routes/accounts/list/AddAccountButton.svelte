<script lang="ts">
  import { translate } from '#lib/translate/index.js';
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
</script>

<HeaderButton icon="mdi:credit-card-plus-outline" href="?action=create" label={$translate('accounts.create_account')} />
