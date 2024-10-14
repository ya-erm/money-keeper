<script lang="ts">
  import Icon from '@iconify/svelte';

  export let name: string;
  export let size: number | string = 1.5;
  export let width: number | string = size;
  export let height: number | string = size;
  export let padding: number | string = 0;
  export let color: string | undefined = undefined;

  const _width = typeof width === 'number' ? `${width}rem` : width;
  const _height = typeof height === 'number' ? `${height}rem` : height;
  const _padding = typeof padding === 'number' ? `${padding}rem` : padding;
</script>

<span class="icon-container" style:padding={_padding}>
  <span style:width={_width} style:height={_height}>
    <Icon icon={name} style={`width:${_width}; height: ${_height}`} {color} inline />
  </span>
</span>

<style>
  .icon-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
