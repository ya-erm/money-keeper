<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Modal from '@ya-erm/svelte-ui/Modal';

  import { translate } from '$lib/translate';

  export let opened: boolean;
  export let onCreateNew: () => void;
  export let onSelectExisting: () => void;
  export let onCancel: () => void;
</script>

<Modal bind:opened header={$translate('transactions.repeatings.title')}>
  <div class="flex-col gap-1">
    <Button text={$translate('transactions.repeatings.create_new')} onClick={onCreateNew} />
    <Button text={$translate('transactions.repeatings.select_existing')} onClick={onSelectExisting} />
    <Button text={$translate('common.cancel')} onClick={onCancel} color="secondary" />
  </div>
</Modal>
