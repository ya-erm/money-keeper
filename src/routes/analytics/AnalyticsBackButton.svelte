<script lang="ts">
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
</script>

<HeaderBackButton href={route('analytics')} title={$translate('analytics.title')} />
