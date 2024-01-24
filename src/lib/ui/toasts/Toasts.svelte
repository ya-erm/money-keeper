<script lang="ts">
  import Toast from './Toast.svelte';
  import { hideToast, toasts } from './toasts';
  import { flip } from 'svelte/animate';
  import { fade, fly } from 'svelte/transition';
</script>

{#if $toasts}
  <section>
    {#each $toasts as toast (toast.id)}
      <div in:fly={{ y: -256 }} out:fade animate:flip={{ duration: 200 }}>
        <Toast
          type={toast.type}
          testId={toast.testId}
          dismissible={toast.dismissible}
          on:dismiss={() => hideToast(toast.id)}
        >
          {#each toast.message.split('\n') as line}
            {line}
            <br />
          {/each}
        </Toast>
      </div>
    {/each}
  </section>
{/if}

<style lang="postcss">
  section {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    display: flex;
    margin-top: 1rem;
    justify-content: center;
    flex-direction: column;
    pointer-events: none;
    z-index: 1000;
  }
  section > * {
    margin: 0 auto;
    margin-top: 5px;
    pointer-events: auto;
  }
</style>
