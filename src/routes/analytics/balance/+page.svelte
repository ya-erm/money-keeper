<script lang="ts">
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AnalyticsBackButton from '../AnalyticsBackButton.svelte';
  import BalanceChart from './BalanceChart.svelte';
</script>

<Layout title={$translate('analytics.balance.title')} leftSlot={AnalyticsBackButton}>
  <BalanceChart />
</Layout>
