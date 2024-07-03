<script lang="ts">
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/header/HeaderButton.svelte';
</script>

<div class="flex">
  <HeaderButton icon="mdi:chart-line" label={$translate('analytics.title')} href={route('analytics.balance')} />
  <HeaderButton icon="mdi:shape-outline" label={$translate('categories.title')} href={route('analytics.categories')} />
  <HeaderButton icon="mdi:briefcase-outline" label={$translate('accounts.title')} href={route('analytics.accounts')} />
</div>
