<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { ActionResult } from '@sveltejs/kit';

  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';
  import createBooleanStore from '$lib/utils/createBooleanStore';

  import type { PageData } from './$types';

  export let data: PageData;
  $: categories = data.categories;

  let categoryId: number | null;
  $: create = categoryId === null;

  const [opened, openModal, closeModal] = createBooleanStore();
  const openCreateModal = () => {
    categoryId = null;
    openModal();
  };
  const openEditModal = (id: number) => () => {
    categoryId = id;
    openModal();
  };

  const onResult = (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'success') {
      showSuccessToast($translate(create ? 'categories.create_category_success' : 'common.save_changes_success'));
      invalidateAll();
      closeModal();
      next(result);
    } else {
      showErrorToast($translate(create ? 'categories.create_category_failure' : 'common.save_changes_failure'));
    }
  };

  const onDelete = (result: ActionResult, next: (result: ActionResult) => void) => {
    if (result.type === 'success') {
      showSuccessToast($translate('categories.delete_category_success'));
      invalidateAll();
      closeModal();
      next(result);
    } else {
      showErrorToast($translate('accounts.delete_account_failure'));
    }
  };
</script>

<div class="grid p-1">
  {#each categories as category (category.id)}
    <button on:click={openEditModal(category.id)} class="grid-item flex-col flex-center gap-0.5 cursor-pointer">
      <div class="circle">
        <Icon name={category.icon || 'mdi:folder-outline'} size={2} />
      </div>
      <span class="text" title={category.name}>
        {category.name}
      </span>
    </button>
  {/each}
  <button on:click={openCreateModal} class="grid-item flex-col flex-center gap-0.5 cursor-pointer">
    <div class="circle">
      <Icon name="mdi:plus" size={2} />
    </div>
    <span class="text">
      {$translate('common.add')}
    </span>
  </button>
</div>

<Modal
  opened={$opened}
  on:close={closeModal}
  header={$translate(create ? 'categories.create_category' : 'categories.edit_category')}
>
  <FormContainer action={create ? '?/create' : '?/update'} {onResult}>
    {@const category = categories.find((x) => x.id === categoryId)}
    <input value={category?.id} name="id" class="hidden" />
    <Input label={$translate('categories.name')} name="name" value={category?.name} required />
    <Input label={$translate('categories.icon')} name="icon" value={category?.icon} optional />
    <Button text={$translate(create ? 'common.create' : 'common.save')} type="submit" />
    {#if !create}
      <FormContainer action="?/delete" onResult={onDelete}>
        <input value={category?.id} name="id" class="hidden" required />
        <Button text={$translate('categories.delete_category')} appearance="transparent" color="danger" type="submit" />
      </FormContainer>
    {/if}
  </FormContainer>
</Modal>

<style>
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
  .grid-item {
    border: none;
    outline: none;
    background: none;
    color: var(--primary-text-color);
  }
  .grid-item:hover,
  .grid-item:focus {
    color: var(--active-color);
  }
  .grid-item .text {
    font-size: 0.8rem;
    max-width: 4rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .grid-item .circle {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    outline: none;
    border: 2px solid var(--border-color);
    border-radius: 100%;
    width: 4rem;
    height: 4rem;
    background: var(--header-background-color);
  }
  .grid-item:hover .circle,
  .grid-item:focus .circle {
    border: 2px solid var(--active-color);
  }
</style>
