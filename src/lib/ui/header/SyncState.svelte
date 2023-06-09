<script lang="ts">
  import { derived } from 'svelte/store';

  import { journalService } from '$lib/data';
  import { translate } from '$lib/translate';
  import { useSmartLoading } from '$lib/utils';

  const state = journalService.$state;

  const downloading = useSmartLoading(derived(state, (value) => value === 'downloading'));
  const uploading = useSmartLoading(derived(state, (value) => value === 'uploading'));
</script>

<div class="sync-info" class:visible={$downloading || $uploading}>
  <span>{$translate('common.synchronizing')}</span>
  {#if $uploading}
    <span class="sync-uploading">↑</span>
  {:else if $downloading}
    <span class="sync-downloading">↓</span>
  {/if}
</div>

<style>
  .sync-info {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
    overflow: hidden;
    height: 0;
    transition: height 0.5s;
  }
  .sync-info.visible {
    height: 1rem;
  }
  .sync-downloading {
    display: inline-block;
    animation: MoveDown 1s linear infinite;
  }
  .sync-uploading {
    display: inline-block;
    animation: MoveDown 1s linear infinite reverse;
  }
  @keyframes MoveDown {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(100%);
    }
  }
</style>
