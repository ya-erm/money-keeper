<script lang="ts">
  import Switch from '$lib/ui/Switch.svelte';
  import ListGroupItem from './ListGroupItem.svelte';

  export let checked: boolean;
  export let title: string;
</script>

<ListGroupItem onClick={() => (checked = !checked)}>
  <div class="theme-switch">
    <input type="checkbox" bind:checked />
    <span>{title}</span>
    <div class="switch">
      <Switch bind:checked />
    </div>
  </div>
</ListGroupItem>

<style>
  .theme-switch {
    flex-grow: 1;
    display: flex;
    align-self: stretch;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 0 10px;
  }
  .theme-switch:hover {
    opacity: 0.9;
  }
  .theme-switch:active {
    opacity: 0.8;
  }
  .theme-switch input {
    display: none;
  }
  .switch {
    pointer-events: none;
  }
</style>
