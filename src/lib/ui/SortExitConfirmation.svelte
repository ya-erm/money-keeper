<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import { translate } from '#lib/translate/index.js';
  import { fitDialogToViewport } from './fitDialogToViewport.js';
  export let opened = false;
  export let busy = false;
  export let onSave: () => void | Promise<void>;
  export let onDiscard: () => void | Promise<void>;
  export let onClose: () => void;
  let visible = true;
  $: if (opened) visible = true;
</script>

{#if opened}
  <Modal bind:opened={visible} {onClose} id="unsaved-sorting" header={$translate('wallets.unsaved_order')} width={22}>
    <div class="flex-col gap-1" data-testId="UnsavedSortDialog" use:fitDialogToViewport>
      <p>{$translate('wallets.unsaved_order_description')}</p>
      <Button text={$translate('common.save')} disabled={busy} onClick={onSave} />
      <Button text={$translate('wallets.discard_order')} color="secondary" disabled={busy} onClick={onDiscard} />
    </div>
  </Modal>
{/if}

<style>
  p {
    margin: 0;
  }
</style>
