<script lang="ts">
  import { translate } from '$lib/translate';
  import DetailsPlaceholder from '$lib/ui/layout/DetailsPlaceholder.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import Analytics from './Analytics.svelte';
</script>

<!-- Keep the overview and the empty details column when no report is selected. -->
<Layout title={$translate('analytics.title')}>
  <Analytics />
  <DetailsPlaceholder slot="details" />
</Layout>
