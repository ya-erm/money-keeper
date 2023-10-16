<script lang="ts">
  import { useRightButton } from '$lib/ui/header';
  import AnalyticsButtons from '../AnalyticsButtons.svelte';
  import CategoriesAnalytics from './CategoriesAnalytics.svelte';

  useRightButton(AnalyticsButtons);
</script>

<CategoriesAnalytics />
