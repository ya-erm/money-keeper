<script lang="ts">
  import Icon from '@iconify/svelte';

  export let name: string;
  export let size: number | string = 1.5;
  export let padding: number | string = 0;
  export let color: string | null = null;

  const width = typeof size === 'number' ? `${size}rem` : size;
  const paddingValue = typeof padding === 'number' ? `${padding}rem` : padding;
</script>

<span class="icon-container" style:padding={paddingValue}>
  <span style:width style:height={width}>
    <Icon icon={name} {width} height={width} {color} inline />
  </span>
</span>

<style>
  .icon-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
