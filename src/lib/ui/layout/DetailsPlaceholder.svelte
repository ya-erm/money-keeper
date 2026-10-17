<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';

  import { translate } from '$lib/translate';
</script>

<div class="placeholder">
  <Icon name="mdi:arrow-left" size={2} />
  <span>{$translate('common.select_page')}</span>
</div>

<style>
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    height: 100%;
    padding: 1rem;
    text-align: center;
    color: var(--secondary-text-color);
  }
</style>
