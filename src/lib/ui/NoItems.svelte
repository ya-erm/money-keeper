<script lang="ts">
  import { translate } from '$lib/translate';
</script>

<div class="no-items">
  <span>{$translate('common.no_items')}</span>
</div>

<style>
  .no-items {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
</style>
