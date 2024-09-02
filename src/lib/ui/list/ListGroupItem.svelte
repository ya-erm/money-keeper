<script lang="ts">
  export let href: string | undefined = undefined;
  export let onClick: (() => void) | undefined = undefined;
</script>

<li class="list-group-item">
  {#if href}
    <a class="item" {href}>
      <slot />
    </a>
  {:else}
    <button class="item" on:click={onClick}>
      <slot />
    </button>
  {/if}
</li>

<style>
  .list-group-item {
    display: flex;
    align-items: center;
    position: relative;
  }
  .list-group-item:not(:last-child) {
    margin-bottom: 1px;
  }
  .list-group-item:not(:last-child):after {
    position: absolute;
    content: '';
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background-color: var(--border-color);
  }
  .list-group-item > .item {
    min-height: 36px;
    width: 100%;
    text-decoration: inherit;
    color: inherit;
    flex-grow: 1;
    display: flex;
  }
  .list-group-item > button.item {
    border: none;
    background: none;
    font-size: inherit;
    padding: 0;
  }
</style>
