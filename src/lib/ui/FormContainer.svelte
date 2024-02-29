<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import type { ActionResult } from '@sveltejs/kit';

  export let width: string | number | null = 15;
  export let action: string | undefined = undefined;
  export let testId: string = 'Form';
  export let onSubmit: (e: SubmitEvent) => void | Promise<void> = () => {};
  export let onResult: ((result: ActionResult, next: (result: ActionResult) => Promise<void>) => void) | null = null;
</script>

<div class="content">
  <form
    {action}
    method="POST"
    class="form-container"
    style:width={typeof width === 'number' ? `${width}rem` : width}
    data-testId={testId}
    on:submit={onSubmit}
    use:enhance={() =>
      async ({ result }) => {
        if (onResult) {
          const next = () => applyAction(result);
          onResult(result, next);
          return;
        }
        await applyAction(result);
      }}
  >
    <slot />
  </form>
  <slot name="footer" />
</div>

<style>
  .content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }
  .form-container {
    max-width: min(100%, calc(100vw - 4rem));
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
