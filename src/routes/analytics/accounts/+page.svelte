<script lang="ts">
  import { onMount } from 'svelte';

  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import Analytics from '../Analytics.svelte';
  import AnalyticsBackButton from '../AnalyticsBackButton.svelte';
  import AnalyticsBalancesVisibilityButton from '../AnalyticsBalancesVisibilityButton.svelte';
  import { resetAnalyticsBalancesVisibility } from '../store';
  import AccountsAnalytics from './AccountsAnalytics.svelte';

  onMount(resetAnalyticsBalancesVisibility);
</script>

<Layout
  section={Analytics}
  sectionTitle={$translate('analytics.title')}
  title={$translate('accounts.title')}
  leftSlot={AnalyticsBackButton}
  rightSlot={AnalyticsBalancesVisibilityButton}
  rightSlotProps={{ triState: true }}
>
  <AccountsAnalytics />
</Layout>
