<script>
  import Button from '$lib/ui/Button.svelte';
  import Modal from '$lib/ui/Modal.svelte';

  let modalOpened = false;
</script>

<h2>Modal</h2>
<Button text="Open" on:click={() => (modalOpened = true)} />
<Modal header="Modal header" bind:opened={modalOpened}>
  <div class="flex-col gap-1">
    <div>Modal content example</div>
    <div class="modal-buttons flex gap-1">
      <div><Button text="Cancel" color="secondary" on:click={() => (modalOpened = false)} /></div>
      <div><Button text="OK" color="primary" /></div>
    </div>
  </div>
</Modal>

<style>
  .modal-buttons > * {
    width: 50%;
    display: flex;
    flex-direction: column;
  }
</style>
