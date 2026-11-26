<script lang="ts">
  import { translate } from '#lib/translate/index.js';
  import Icon from '@ya-erm/svelte-ui/Icon';

  import ListGroupItem from './ListGroupItem.svelte';

  export let title: string;
  export let icon: string | null = null;
  export let href: string | undefined = undefined;
  export let value: string | null | undefined = undefined;
  export let disabled = false;
  export let onClick: (() => void) | undefined = undefined;
</script>

<ListGroupItem {href} {onClick}>
  <div class="container" class:disabled class:with-icon={!!icon}>
    <div class="label">
      {#if icon}<span class="setting-icon" aria-hidden="true"><Icon name={icon} size={1.25} /></span>{/if}
      <span class="title" class:with-icon={!!icon}>{title}</span>
    </div>
    <div class="value-container">
      <span class="value-text">{value == undefined ? $translate('common.select') : value}</span>
      <Icon name="mdi:chevron-right" />
    </div>
  </div>
</ListGroupItem>

<style>
  .container {
    flex-grow: 1;
    display: flex;
    align-self: stretch;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 0 10px;
    gap: 10px;
    overflow: hidden;
  }
  .container.with-icon {
    min-height: 44px;
    padding: 4px 10px;
    box-sizing: border-box;
  }
  .label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    text-align: left;
  }
  .setting-icon {
    display: inline-flex;
    flex-shrink: 0;
    width: 1.5rem;
    color: var(--secondary-text-color);
  }
  .title.with-icon {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .container.disabled {
    cursor: auto;
    opacity: 0.5;
  }
  .title {
    white-space: nowrap;
  }
  .value-container {
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;
    gap: 5px;
    overflow: hidden;
  }
  .value-text {
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    max-width: calc(100% - 25px);
    overflow: hidden;
  }
</style>
