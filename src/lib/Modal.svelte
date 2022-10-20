<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';

  export let opened: boolean;
  export let header: string | null = null;

  const dispatch = createEventDispatcher();
  const close = () => dispatch('close');

  let modal: HTMLDivElement;

  const handleKeydown = (e: KeyboardEvent) => {
    if (opened && e.key === 'Escape') {
      close();
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

{#if opened}
  <div class="modal-background" on:click={close} aria-hidden />
  <div class="modal" role="dialog" aria-modal="true" bind:this={modal}>
    {#if $$slots.header}
      <slot name="header" />
    {:else if !!header}
      <div class="header">{header}</div>
    {/if}
    <slot />
  </div>
{/if}

<style>
  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
  }
  .modal {
    left: 50%;
    top: 50%;
    position: absolute;
    transform: translate(-50%, -50%);
    max-width: calc(100vw - 4em);
    max-height: calc(100vh - 4em);
    border-radius: 0.75em;
    background: white;
    padding: 1em;
    overflow: auto;
  }
  .header {
    font-weight: 600;
    text-align: center;
    margin-bottom: 1rem;
  }
</style>
