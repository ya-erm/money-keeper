<script>
  import ColorItem from './ColorItem.svelte';
</script>

<h2>Colors</h2>
<div class="flex gap-1">
  <div class="flex-col gap-1">
    <ColorItem color="--primary-text-color" />
    <ColorItem color="--secondary-text-color" />
    <ColorItem color="--active-text-color" />
    <ColorItem color="--background-color" />
    <ColorItem color="--header-background-color" />
    <ColorItem color="--hover-background-color" />
    <ColorItem color="--border-color" />
  </div>
  <div class="flex-col gap-1">
    <ColorItem color="--red-color" />
    <ColorItem color="--orange-color" />
    <ColorItem color="--green-color" />
    <ColorItem color="--white-color" />
    <ColorItem color="--active-color" />
  </div>
</div>
