<script lang="ts">
  export let color: string = '';
</script>

<div class="color-item">
  <div class="color" style:background-color={color.startsWith('--') ? `var(${color})` : color}></div>
  <span>{color}</span>
</div>

<style>
  .color-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .color {
    width: 1rem;
    height: 1rem;
    border: 1px solid;
  }
</style>
