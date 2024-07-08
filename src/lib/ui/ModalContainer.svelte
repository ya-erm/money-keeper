<script lang="ts">
  import { fade } from 'svelte/transition';
</script>

<div class="modal-container" in:fade={{ duration: 300 }} out:fade={{ duration: 300 }}>
  <slot />
</div>

<style>
  .modal-container {
    position: fixed;
    z-index: 100;
  }
</style>
