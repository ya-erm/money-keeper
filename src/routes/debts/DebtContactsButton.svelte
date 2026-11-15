<script lang="ts">
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  import { route } from '#lib/routes.js';
  import { translate } from '#lib/translate/index.js';
</script>

<HeaderButton icon="mdi:account-outline" label={$translate('debts.contacts')} href={route('debts.contacts')} />
