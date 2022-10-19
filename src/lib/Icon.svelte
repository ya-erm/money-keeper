<script lang="ts">
  import { onMount } from 'svelte';

  export let path: string;
  export let size: number | string = 30;
  export let color: string | null = null;
  const width = typeof size === 'number' ? `${size}px` : size;

  let element: HTMLElement;

  if (!color) {
    onMount(() => {
      const fontColor = window.getComputedStyle(element).color;
      element.style.backgroundColor = fontColor;
    });
  }
</script>

<i
  bind:this={element}
  class="icon"
  style:width
  style:height={width}
  style:mask-image={`url('${path}')`}
  style:background-color={color}
  style={`-webkit-mask-image:url('${path}')`}
/>

<style>
  .icon {
    flex-shrink: 0;
    display: inline-block;
    mask: no-repeat 50% 50%;
  }
</style>
