<script lang="ts">
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  import { translate } from '#lib/translate/index.js';
  export let onClick: () => void = () => {};
</script>

<HeaderButton icon="mdi:pencil" label={$translate('common.edit')} {onClick} />
