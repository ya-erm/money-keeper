<script lang="ts">
  export let hidden: boolean;
  export let duration = '0.5s';

  let content: HTMLDivElement;
</script>

<div
  class="spoiler"
  class:spoiler-hidden={hidden}
  style:--height={`${content?.getBoundingClientRect()?.height}px`}
  style:--duration={duration}
>
  <div class="spoiler-content" bind:this={content}>
    <slot />
  </div>
</div>

<style>
  .spoiler {
    overflow: hidden;
    height: var(--height, auto);
    transition: height var(--duration, 0.5s);
  }
  .spoiler-hidden {
    height: 0;
  }
</style>
