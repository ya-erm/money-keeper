<script lang="ts">
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';
</script>

<HeaderButton
  icon="mdi:plus"
  href={route('analytics.accounts.groupings.edit')}
  label={$translate('analytics.groupings.create_grouping')}
/>
