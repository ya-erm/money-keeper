<script lang="ts">
  import { translate } from '$lib/translate';
  import { useTitle } from '$lib/ui/header';

  import Settings from './Settings.svelte';

  useTitle($translate('settings.title'));
</script>

<Settings />
