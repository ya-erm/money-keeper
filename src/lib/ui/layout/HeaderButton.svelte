<script lang="ts">
  import { replaceState } from '$app/navigation';
  import { page } from '$app/stores';

  import Icon from '@ya-erm/svelte-ui/Icon';

  export let href: string | null = null;
  export let icon: string;
  export let label: string;
  export let disabled: boolean = false;
  export let onClick: (() => void) | null = null;
</script>

{#if href}
  <button {disabled}>
    <a title={label} aria-label={label} {href} on:click={() => replaceState(href, $page.state)}>
      <Icon name={icon} padding={1} />
    </a>
  </button>
{:else}
  <button title={label} aria-label={label} on:click={onClick} {disabled}>
    <Icon name={icon} padding={1} />
  </button>
{/if}

<style>
  a {
    display: inline-block;
  }
  button {
    border: none;
    outline: none;
    display: inline-block;
    background: transparent;
    color: var(--active-color);
    cursor: pointer;
    padding: 0;
    transition: color 0.5s;
  }
  button:disabled,
  button:disabled > a {
    color: var(--secondary-text-color);
    pointer-events: none;
  }
</style>
