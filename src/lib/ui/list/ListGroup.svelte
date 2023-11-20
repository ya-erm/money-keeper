<script lang="ts">
  export let title: string = '';
</script>

<div class="list-group">
  <div class="list-group-title">{title}</div>
  <ul class="list-group-container">
    <slot />
  </ul>
  {#if $$slots.description}
    <div class="list-group-description">
      <slot name="description" />
    </div>
  {/if}
</div>

<style>
  .list-group {
    padding: 1rem;
    padding-bottom: 0;
  }
  .list-group-title {
    color: var(--secondary-text-color);
    text-transform: uppercase;
    margin-bottom: 10px;
    margin-left: 10px;
    font-size: 12px;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list-group-container {
    background-color: var(--header-background-color);
  }
  .list-group-description {
    color: var(--secondary-text-color);
    line-height: 1.5;
    font-size: 13px;
    margin: 10px;
  }
  .list-group-container {
    border-radius: 10px;
  }
</style>
