<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  export let opened: boolean;
  export let header: string | null = null;
  export let width: string | number | null = null;

  const dispatch = createEventDispatcher();
  const close = () => {
    opened = false;
    dispatch('close');
  };

  let modal: HTMLDivElement;

  const handleKeydown = (e: KeyboardEvent) => {
    if (opened && e.key === 'Escape') {
      close();
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

{#if opened}
  <div
    class="modal-background flex-center"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 300 }}
    on:click={close}
    aria-hidden
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      bind:this={modal}
      on:click|stopPropagation
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
      style:width={typeof width === 'string' ? width : `${width}rem`}
      aria-hidden
    >
      {#if $$slots.header}
        <slot name="header" />
      {:else if !!header}
        <div class="header">{header}</div>
      {/if}
      <slot />
    </div>
  </div>
{/if}

<style>
  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    background: rgba(0, 0, 0, 0.3);
  }
  :global(body.dark-mode .modal-background) {
    background: rgba(0, 0, 0, 0.7);
  }
  .modal {
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
    border-radius: 1.5em;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    padding: 1em;
    overflow: auto;
    z-index: 101;
  }
  .header {
    font-weight: 600;
    text-align: center;
    margin-bottom: 1rem;
  }
</style>
