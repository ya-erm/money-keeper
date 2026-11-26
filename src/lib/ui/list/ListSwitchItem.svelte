<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Switch from '@ya-erm/svelte-ui/Switch';

  import ListGroupItem from './ListGroupItem.svelte';

  export let checked: boolean;
  export let title: string;
  export let icon: string | null = null;
  export let onChange: ((checked: boolean) => void) | undefined = undefined;

  const toggle = () => {
    checked = !checked;
    onChange?.(checked);
  };
</script>

<ListGroupItem onClick={toggle}>
  <div class="theme-switch" class:with-icon={!!icon}>
    <input type="checkbox" bind:checked />
    <span class="label"
      >{#if icon}<span class="setting-icon" aria-hidden="true"><Icon name={icon} size={1.25} /></span>{/if}<span
        >{title}</span
      ></span
    >
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
  .theme-switch.with-icon {
    min-height: 44px;
    padding: 4px 10px;
    box-sizing: border-box;
    gap: 10px;
  }
  .label {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
  }
  .setting-icon {
    display: inline-flex;
    flex-shrink: 0;
    width: 1.5rem;
    color: var(--secondary-text-color);
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
    flex-shrink: 0;
  }
</style>
