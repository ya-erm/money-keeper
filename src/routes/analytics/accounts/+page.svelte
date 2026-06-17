<script lang="ts">
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import AnalyticsBackButton from '../AnalyticsBackButton.svelte';
  import AccountsAnalytics from './AccountsAnalytics.svelte';
</script>

<Layout title={$translate('accounts.title')} leftSlot={AnalyticsBackButton}>
  <AccountsAnalytics />
</Layout>
