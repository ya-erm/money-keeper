<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let type: 'button' | 'submit' = 'button';
  export let disabled: boolean = false;
  export let testId: string | null = 'Button';
  const dispatch = createEventDispatcher();
  export let click = (e: MouseEvent) => dispatch('click', e);
</script>

<button on:click|stopPropagation={click} data-testId={testId} {disabled} {type} {...$$restProps}>
  <slot />
</button>

<style>
  button {
    min-width: 0;
    font-size: 1rem;
    font-weight: normal;
    display: inline-flex;
    cursor: pointer;
    outline: none;
    border: none;

    color: inherit;
    background: none;

    border-radius: 0.5rem;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }
  button:focus-visible {
    outline-offset: 2px;
    outline: 2px solid var(--active-color);
  }
</style>
