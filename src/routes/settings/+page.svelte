<script lang="ts">
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import DetailsPlaceholder from '$lib/ui/layout/DetailsPlaceholder.svelte';

  import Settings from './Settings.svelte';
</script>

<Layout title={$translate('settings.title')}>
  <Settings />
  <DetailsPlaceholder slot="details" />
</Layout>
