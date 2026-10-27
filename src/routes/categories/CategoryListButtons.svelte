<script lang="ts">
  import { translate } from '#lib/translate/index.js';
  import HeaderButton from '#lib/ui/layout/HeaderButton.svelte';
</script>

<div class="flex">
  <HeaderButton icon="mdi:plus" href="?action=create" label={$translate('categories.create_category')} />
</div>
