<script lang="ts">
  import { onMount } from 'svelte';

  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AnalyticsBackButton from '../AnalyticsBackButton.svelte';
  import AnalyticsBalancesVisibilityButton from '../AnalyticsBalancesVisibilityButton.svelte';
  import { resetAnalyticsBalancesVisibility } from '../store';
  import BalanceChart from './BalanceChart.svelte';

  onMount(resetAnalyticsBalancesVisibility);
</script>

<Layout
  title={$translate('analytics.balance.title')}
  leftSlot={AnalyticsBackButton}
  rightSlot={AnalyticsBalancesVisibilityButton}
>
  <BalanceChart />
</Layout>
