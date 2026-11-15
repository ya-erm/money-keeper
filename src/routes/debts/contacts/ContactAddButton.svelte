<script lang="ts">
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
  import { translate } from '#lib/translate/index.js';
  export let onClick: () => void = () => {};
</script>

<HeaderButton icon="mdi:plus" label={$translate('debts.new_contact')} {onClick} />
