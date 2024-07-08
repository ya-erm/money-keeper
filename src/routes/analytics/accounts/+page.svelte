<script lang="ts">
  import { useLeftButton, useRightButton } from '$lib/ui/header';
  import AnalyticsButtonsLeft from '../AnalyticsButtonsLeft.svelte';
  import AnalyticsButtonsRight from '../AnalyticsButtonsRight.svelte';
  import AccountsAnalytics from './AccountsAnalytics.svelte';

  useLeftButton(AnalyticsButtonsLeft);
  useRightButton(AnalyticsButtonsRight);
</script>

<AccountsAnalytics />
