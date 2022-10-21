<script>
  import Button from '$lib/ui/Button.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import createBooleanStore from '$lib/utils/createBooleanStore';

  let [opened, openModal, closeModal] = createBooleanStore();
</script>

<h2>Modals</h2>
<Button text="Open" on:click={openModal} />
<Modal header="Modal header" opened={$opened} on:close={closeModal}>
  <div class="flex-col gap-1">
    <div>Modal content example</div>
    <div class="modal-buttons flex gap-1">
      <div><Button text="Cancel" color="secondary" on:click={closeModal} /></div>
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
