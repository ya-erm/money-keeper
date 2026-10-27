<script lang="ts">
  import { route } from '#lib/routes.js';
  import { translate } from '#lib/translate/index.js';
  import HeaderBackButton from '#lib/ui/layout/HeaderBackButton.svelte';
</script>

<HeaderBackButton href={route('analytics')} title={$translate('analytics.title')} />
