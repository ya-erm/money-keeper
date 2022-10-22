<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { ActionResult } from '@sveltejs/kit';

  export let action: string | undefined = undefined;
  export let onSubmit: (e: SubmitEvent) => void | Promise<void> = () => {};
  export let onResult: ((result: ActionResult<any>) => void) | null = null;
</script>

<div class="content">
  <form
    {action}
    method="POST"
    class="form-container"
    on:submit={onSubmit}
    use:enhance={() =>
      async ({ result }) => {
        if (onResult) {
          return onResult(result);
        }
        // rerun the `load` function for the page
        // https://kit.svelte.dev/docs/modules#$app-navigation-invalidateall
        // invalidateAll();

        // since we're customizing the default behaviour
        // we don't want to reimplement what `use:enhance` does
        // so we can use `applyResult` and pass the `result`
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
    width: 300px;
    max-width: calc(100vw - 4rem);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
