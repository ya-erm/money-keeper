<script lang="ts">
  import type { CategoryType } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import Modal from '$lib/ui/Modal.svelte';
  import CreateCategoryForm from './CreateCategoryForm.svelte';

  export let type: CategoryType;
  export let opened: boolean;

  export let onCreate: () => void;

  const handleCreate = () => {
    opened = false;
    onCreate();
  };
</script>

<Modal header={$translate('categories.create_category')} bind:opened>
  <CreateCategoryForm {type} onCreate={handleCreate} />
</Modal>
