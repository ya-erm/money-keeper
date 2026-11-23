<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import { translate } from '#lib/translate/index.js';
  export let sorting = false;
  export let busy = false;
  export let participantName = '';
  export let padded = false;
  export let onSave: () => void | Promise<void>;
  export let onCancel: () => void | Promise<void>;
</script>

<div class="sorting-toolbar" data-testId="SortingToolbar">
  <div class="panel controls" class:active={sorting} inert={!sorting} aria-hidden={!sorting}>
    <div class="sorting sorting-bar" class:padded>
      <span class="caption"
        >{$translate('common.sorting')}{#if participantName}<small>{participantName}</small>{/if}</span
      >
      <div class="grid-col-2 gap-1">
        <Button color="white" disabled={busy} onClick={onCancel}>{$translate('common.cancel')}</Button>
        <Button disabled={busy} onClick={onSave}>{$translate('common.save')}</Button>
      </div>
    </div>
  </div>
  <div class="panel search" class:active={!sorting} inert={sorting} aria-hidden={sorting}>
    <slot />
  </div>
</div>

<style>
  .sorting-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow: hidden;
    overflow: clip;
    min-width: 0;
    width: 100%;
  }
  .panel {
    grid-area: 1 / 1;
    min-width: 0;
    align-self: center;
    transition: transform 0.5s ease;
    pointer-events: none;
  }
  .controls {
    transform: translateX(-100%);
  }
  .search {
    transform: translateX(100%);
  }
  .panel.active {
    transform: translateX(0);
    pointer-events: auto;
  }
  .sorting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  .padded {
    padding: 0 1rem;
  }
  .caption {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .sorting > .grid-col-2 {
    flex-shrink: 0;
  }
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--secondary-text-color);
  }
  @media (prefers-reduced-motion: reduce) {
    .panel {
      transition: none;
    }
  }
</style>
