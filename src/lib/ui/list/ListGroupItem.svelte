<script lang="ts">
  export let href: string | undefined = undefined;
</script>

{#if href}
  <li class="list-group-item">
    <a class="link" {href}>
      <slot />
    </a>
  </li>
{:else}
  <li class="list-group-item">
    <slot />
  </li>
{/if}

<style>
  .list-group-item .link {
    text-decoration: inherit;
    color: inherit;
    flex-grow: 1;
  }
  .list-group-item {
    min-height: 36px;
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
</style>
