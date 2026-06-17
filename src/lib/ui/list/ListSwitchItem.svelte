<script lang="ts">
  import Switch from '@ya-erm/svelte-ui/Switch';

  import ListGroupItem from './ListGroupItem.svelte';

  export let checked: boolean;
  export let title: string;
  export let onChange: ((checked: boolean) => void) | undefined = undefined;

  const toggle = () => {
    checked = !checked;
    onChange?.(checked);
  };
</script>

<ListGroupItem onClick={toggle}>
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
