<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '$lib/ui/Icon.svelte';

  export let href: string;
  export let icon: string;
  export let label: string;
  export let onClick: (() => void) | null = null;
</script>

{#if onClick}
  <button title={label} aria-label={label} on:click={onClick}>
    <Icon name={icon} padding={1} />
  </button>
{:else}
  <a title={label} aria-label={label} {href} on:click={() => goto(href, { replaceState: true })}>
    <Icon name={icon} padding={1} />
  </a>
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
  }
</style>
