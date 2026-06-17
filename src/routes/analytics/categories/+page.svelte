<script lang="ts">
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AnalyticsBackButton from '../AnalyticsBackButton.svelte';
  import CategoriesAnalytics from './CategoriesAnalytics.svelte';
</script>

<Layout title={$translate('categories.title')} leftSlot={AnalyticsBackButton}>
  <CategoriesAnalytics />
</Layout>
