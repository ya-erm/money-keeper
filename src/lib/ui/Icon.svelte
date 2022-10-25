<script lang="ts">
  import { onMount } from 'svelte';
  import { darkMode } from './theme';

  export let path: string;
  export let size: number | string = 1.5;
  export let padding: number | string = 0;
  export let color: string | null = null;

  const width = typeof size === 'number' ? `${size}rem` : size;
  const paddingValue = typeof padding === 'number' ? `${padding}rem` : padding;

  let element: HTMLElement;

  if (!color) {
    const pickColor = () => {
      const fontColor = window.getComputedStyle(element).color;
      element.style.backgroundColor = fontColor;
    };
    onMount(() => darkMode.subscribe(() => setTimeout(pickColor, 10)));
  }
</script>

<span class="icon-container" style:padding={paddingValue}>
  <i
    bind:this={element}
    class="icon"
    style:width
    style:height={width}
    style:mask-image={`url('${path}')`}
    style:background-color={color}
    style={`-webkit-mask-image:url('${path}')`}
  />
</span>

<style>
  .icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon {
    flex-shrink: 0;
    display: inline-block;
    mask: no-repeat 50% 50%;
  }
</style>
