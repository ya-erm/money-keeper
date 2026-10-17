<script lang="ts">
  import { onMount } from 'svelte';

  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import Analytics from '../Analytics.svelte';

  import AnalyticsBackButton from '../AnalyticsBackButton.svelte';
  import AnalyticsBalancesVisibilityButton from '../AnalyticsBalancesVisibilityButton.svelte';
  import { resetAnalyticsBalancesVisibility } from '../store';
  import BalanceChart from './BalanceChart.svelte';

  onMount(resetAnalyticsBalancesVisibility);
</script>

<Layout
  section={Analytics}
  sectionTitle={$translate('analytics.title')}
  title={$translate('analytics.balance.title')}
  leftSlot={AnalyticsBackButton}
  rightSlot={AnalyticsBalancesVisibilityButton}
>
  <BalanceChart />
</Layout>
