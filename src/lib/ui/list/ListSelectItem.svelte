<script lang="ts">
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';

  import ListGroupItem from './ListGroupItem.svelte';

  export let title: string;
  export let href: string | undefined = undefined;
  export let value: string | undefined = undefined;
  export let disabled = false;
  export let onClick: (() => void) | undefined = undefined;
</script>

<ListGroupItem {href} {onClick}>
  <div class="container" class:disabled>
    <span class="title">{title}</span>
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
