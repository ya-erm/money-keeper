<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Modal from '$lib/ui/Modal.svelte';

  export let opened: boolean;
  export let onCreateNew: () => void;
  export let onSelectExisting: () => void;
  export let onCancel: () => void;
</script>

<Modal bind:opened header={$translate('transactions.repeatings.title')}>
  <div class="flex-col gap-1">
    <Button text={$translate('transactions.repeatings.create_new')} on:click={onCreateNew} />
    <Button text={$translate('transactions.repeatings.select_existing')} on:click={onSelectExisting} />
    <Button text={$translate('common.cancel')} on:click={onCancel} color="secondary" />
  </div>
</Modal>
