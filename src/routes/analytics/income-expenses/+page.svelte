<script lang="ts">
  import { onMount } from 'svelte';

  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AnalyticsBackButton from '../AnalyticsBackButton.svelte';
  import AnalyticsBalancesVisibilityButton from '../AnalyticsBalancesVisibilityButton.svelte';
  import { resetAnalyticsBalancesVisibility } from '../store';
  import IncomeExpensesChart from './IncomeExpensesChart.svelte';

  onMount(resetAnalyticsBalancesVisibility);
</script>

<Layout
  title={$translate('analytics.income_expenses.title')}
  leftSlot={AnalyticsBackButton}
  rightSlot={AnalyticsBalancesVisibilityButton}
>
  <IncomeExpensesChart />
</Layout>
