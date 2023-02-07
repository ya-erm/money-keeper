<script lang="ts">
  import { translate } from '$lib/translate';

  export let type: 'NoItems' | 'NothingFound' = 'NoItems';
</script>

<div class="no-items">
  <span>{$translate(type === 'NoItems' ? 'common.no_items' : 'common.nothing_found')}</span>
</div>

<style>
  .no-items {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
</style>
