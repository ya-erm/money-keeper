<script lang="ts">
  export let href: string | undefined = undefined;
</script>

{#if href}
  <a class="settings-group-item" {href}>
    <slot />
  </a>
{:else}
  <div class="settings-group-item">
    <slot />
  </div>
{/if}

<style>
  a.settings-group-item {
    text-decoration: inherit;
    color: inherit;
  }
  .settings-group-item {
    min-height: 36px;
    display: flex;
    align-items: center;
    position: relative;
  }
  .settings-group-item:not(:last-child) {
    margin-bottom: 1px;
  }
  .settings-group-item:not(:last-child):after {
    position: absolute;
    content: '';
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background-color: var(--border-color);
  }
</style>
