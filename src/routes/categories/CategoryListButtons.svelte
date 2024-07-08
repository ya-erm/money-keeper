<script lang="ts">
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/header/HeaderButton.svelte';
</script>

<div class="flex">
  <HeaderButton icon="mdi:plus" href="?action=create" label={$translate('categories.create_category')} />
</div>
