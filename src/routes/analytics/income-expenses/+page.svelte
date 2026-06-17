<script lang="ts">
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AnalyticsBackButton from '../AnalyticsBackButton.svelte';
  import IncomeExpensesChart from './IncomeExpensesChart.svelte';
</script>

<Layout title={$translate('analytics.income_expenses.title')} leftSlot={AnalyticsBackButton}>
  <IncomeExpensesChart />
</Layout>
