<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import IntersectionObserver from '$lib/ui/IntersectionObserver.svelte';

  export let limit: number;
  export let step: number;
  export let total: number;

  let showMoreContainer: HTMLDivElement;

  const showMore = () => {
    limit = Math.min(total, limit + step);
  };
</script>

<IntersectionObserver element={showMoreContainer} on:intersect={showMore}>
  <slot />
  <div class="show-more">
    <div bind:this={showMoreContainer} class="show-more-before"></div>
    {#if limit < total}
      <div class="flex-col px-1 pb-1">
        <Button color="white" on:click={showMore}>
          {$translate('transactions.show_more')}
        </Button>
      </div>
    {/if}
  </div>
</IntersectionObserver>

<style>
  .show-more {
    position: relative;
  }
  .show-more-before {
    position: absolute;
    top: -200px;
  }
</style>
