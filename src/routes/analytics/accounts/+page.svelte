<script lang="ts">
  import { useRightButton } from '$lib/ui/header';
  import AnalyticsButtons from '../AnalyticsButtons.svelte';
  import AccountsAnalytics from './AccountsAnalytics.svelte';

  useRightButton(AnalyticsButtons);
</script>

<AccountsAnalytics />
