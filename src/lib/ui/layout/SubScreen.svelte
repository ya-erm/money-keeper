<script lang="ts">
  import type { Component } from 'svelte';

  import Portal from '@ya-erm/svelte-ui/Portal';

  import Layout from './Layout.svelte';

  /**
   * Nested screen opened on top of the current page.
   * On mobile it takes the whole screen, on wide screens it is shown as a centered panel.
   */
  export let visible: boolean;
  export let title: string;
  export let onBack: VoidFunction;
  export let rightSlot: Component | null = null;
  export let rightSlotProps: Record<string, unknown> = {};
  export let testId: string = 'Portal';
  /** Panel width on wide screens */
  export let width: string = '40rem';

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onBack();
    }
  };
</script>

<Portal {visible} {testId}>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="sub-screen" style:--panel-width={width} on:keydown={handleKeydown}>
    <Layout {title} {onBack} {rightSlot} {rightSlotProps} hideMenu panel>
      <slot />
    </Layout>
  </div>
</Portal>

<style>
  .sub-screen {
    height: 100%;
  }
  @media (min-width: 768px) {
    .sub-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: rgba(0, 0, 0, 0.3);
    }
    :global(body.dark-mode) .sub-screen {
      background: rgba(0, 0, 0, 0.7);
    }
  }
</style>
