<script lang="ts">
  export let hidden: boolean;
  export let duration = '0.5s';

  let content: HTMLDivElement;

  $: height = hidden ? 0 : content?.getBoundingClientRect()?.height;
</script>

<div class="spoiler-header" style:--duration={duration}>
  <slot name="spoiler-header" />
</div>
<div class="spoiler" class:spoiler-hidden={hidden} style:--height={`${height}px`} style:--duration={duration}>
  <div class="spoiler-content" bind:this={content}>
    <slot />
  </div>
</div>

<style>
  .spoiler {
    overflow: hidden;
    height: var(--height, auto);
    transition: height var(--duration, 0.5s);
    flex-shrink: 0;
  }
  .spoiler-hidden {
    height: 0;
  }
</style>
