<script lang="ts">
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AnalyticsButtonsLeft from '../AnalyticsButtonsLeft.svelte';
  import AnalyticsButtonsRight from '../AnalyticsButtonsRight.svelte';
  import IncomeExpensesChart from './IncomeExpensesChart.svelte';
</script>

<Layout title={$translate('analytics.title')} leftSlot={AnalyticsButtonsLeft} rightSlot={AnalyticsButtonsRight}>
  <IncomeExpensesChart />
</Layout>
