<script lang="ts">
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';
</script>

<div class="flex">
  <HeaderButton icon="mdi:shape-outline" label={$translate('categories.title')} href={route('analytics.categories')} />
</div>
