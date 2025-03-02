<script lang="ts">
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import Settings from './Settings.svelte';
</script>

<Layout title={$translate('settings.title')}>
  <Settings />
</Layout>
