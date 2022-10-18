<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let text: string | null = null;
  export let appearance: 'primary' | 'secondary' | 'transparent' = 'primary';
  export let type: 'button' | 'submit' = 'button';

  export let click: ((e: MouseEvent) => void) | null = null;
</script>

<button on:click={click} class:primary={appearance === 'primary'} class:secondary={appearance === 'secondary'} {type}>
  {#if text}
    {text}
  {/if}
  <slot />
</button>

<style>
  button {
    font-size: 1rem;
    padding: 0.75rem;
    border-radius: 0.75rem;
    cursor: pointer;
    outline: none;
    border: none;
  }
  button:hover {
    opacity: 0.9;
  }
  button:active {
    opacity: 0.8;
  }
  button.primary {
    background-color: var(--active-color);
    color: var(--white-color);
  }
  button.secondary {
    background-color: var(--border-color);
  }
</style>
