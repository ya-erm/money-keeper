<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let text: string | null = null;
  export let appearance: 'solid' | 'transparent' = 'solid';
  export let color: 'primary' | 'secondary' | 'white' | 'success' | 'danger' = 'primary';
  export let type: 'button' | 'submit' = 'button';
  export let bordered: boolean = false;

  const dispatch = createEventDispatcher();
  export let click = (e: MouseEvent) => dispatch('click', e);
</script>

<button
  on:click={click}
  class:primary={color === 'primary'}
  class:secondary={color === 'secondary'}
  class:success={color === 'success'}
  class:danger={color === 'danger'}
  class:white={color === 'white'}
  class:solid={appearance === 'solid'}
  class:transparent={appearance === 'transparent'}
  class:border={bordered === true}
  {type}
>
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
  button.border {
    box-shadow: 0 0 0 1px var(--border-color);
  }

  /* Solid */
  button.solid {
    color: var(--white-color);
  }
  button.primary {
    background-color: var(--active-color);
  }
  button.secondary {
    background-color: var(--secondary-text-color);
  }
  button.success {
    background-color: var(--green-color);
  }
  button.danger {
    background-color: var(--red-color);
  }
  button.white {
    color: var(--primary-text-color);
    background: var(--header-background-color);
  }
  /* Transparent */
  button.transparent {
    background: none;
  }

  button.transparent.primary {
    color: var(--active-color);
  }
  button.transparent.primary.border {
    box-shadow: 0 0 0 1px var(--active-color);
  }

  button.transparent.secondary {
    color: var(--secondary-text-color);
  }
  button.transparent.secondary.border {
    box-shadow: 0 0 0 1px var(--secondary-text-color);
  }

  button.transparent.success {
    color: var(--green-color);
  }
  button.transparent.success.border {
    box-shadow: 0 0 0 1px var(--green-color);
  }

  button.transparent.danger {
    color: var(--red-color);
  }
  button.transparent.danger.border {
    box-shadow: 0 0 0 1px var(--red-color);
  }
</style>
