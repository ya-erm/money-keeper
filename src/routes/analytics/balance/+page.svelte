<script lang="ts">
  import { useLeftButton, useRightButton } from '$lib/ui/header';

  import AnalyticsButtonsLeft from '../AnalyticsButtonsLeft.svelte';
  import AnalyticsButtonsRight from '../AnalyticsButtonsRight.svelte';
  import BalanceChart from './BalanceChart.svelte';

  useLeftButton(AnalyticsButtonsLeft);
  useRightButton(AnalyticsButtonsRight);
</script>

<BalanceChart />
