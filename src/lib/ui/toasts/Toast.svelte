<script lang="ts">
  import Icon from '$lib/ui/Icon.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { ToastType } from './toasts';

  const dispatch = createEventDispatcher();

  export let type: ToastType = 'error';
  export let dismissible = true;

  const icon = (() => {
    switch (type) {
      case 'info':
        return '/icons/information-outline.svg';
      case 'error':
        return '/icons/close-circle-outline.svg';
      case 'success':
        return '/icons/check-circle-outline.svg';
    }
  })();
</script>

<article class={type} role="alert">
  <Icon path={icon} size={1.5} />
  <div class="text">
    <slot />
  </div>
  {#if dismissible}
    <button class="close" on:click={() => dispatch('dismiss')}>
      <Icon path="/icons/close.svg" size={1.5} />
    </button>
  {/if}
</article>

<style>
  article {
    color: white;
    padding: 0.75rem;
    border-radius: 0.75rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    width: 20rem;
  }
  .error {
    background: var(--red-color);
  }
  .success {
    background: var(--green-color);
  }
  .info {
    background: var(--active-color);
  }
  .text {
    flex-grow: 1;
  }
  button.close {
    color: white;
    background: transparent;
    border: 0 none;
    padding: 0;
    margin: 0;
    line-height: 1;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
