<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from './Button.svelte';
  import Input from './Input.svelte';
  import Modal from './Modal.svelte';
  import { longPress } from '$lib/utils';

  export let tags: { id: string; title: string }[];
  export let selected: string[];
  export let onChange: (id: string, selected: boolean) => void;
  export let onAdd: (title: string) => Promise<void> | void;
  export let onEdit: (id: string, title: string) => Promise<void> | void;
  export let onDelete: (id: string) => Promise<void> | void;

  let id = '';
  let title = '';
  let opened = false;
  let mode: 'add' | 'edit' = 'add';

  const handleOpenModal = (item: { id: string; title: string } | null) => {
    mode = item ? 'edit' : 'add';
    title = item?.title ?? '';
    id = item?.id ?? '';
    opened = true;
  };

  const handleSubmit = async () => {
    if (mode === 'add') {
      await onAdd(title);
    } else {
      await onEdit(id, title);
    }
    opened = false;
  };

  const handleDelete = async () => {
    await onDelete(id);
    opened = false;
  };
</script>

<div class="flex flex-wrap container" data-testId="TagsContainer">
  {#each tags as tag (tag.id)}
    {@const isSelected = selected.includes(tag.id)}
    <button
      class="tag"
      type="button"
      class:selected={isSelected}
      on:click={() => onChange(tag.id, !isSelected)}
      use:longPress={() => handleOpenModal(tag)}
    >
      {tag.title}
    </button>
  {/each}
  <button class="tag add" type="button" on:click={() => handleOpenModal(null)} data-testId="AddTagButton">
    {$translate('common.add')}
  </button>
</div>

<Modal
  {opened}
  header={$translate(mode === 'add' ? 'tags.add_modal_header' : 'tags.edit_modal_header')}
  on:close={() => (opened = false)}
>
  <form on:submit|preventDefault={handleSubmit} class="flex-col gap-1" data-testId="AddTagForm">
    <Input label={$translate('tags.title')} bind:value={title} name="title" required />

    <div class="flex gap-1">
      <div class="flex-col flex-1">
        {#if mode === 'edit'}
          <Button color="danger" text={$translate('common.delete')} on:click={handleDelete} />
        {:else}
          <Button color="secondary" on:click={() => (opened = false)} text={$translate('common.cancel')} />
        {/if}
      </div>
      <div class="flex-col flex-1">
        <Button text={$translate(mode === 'add' ? 'common.add' : 'common.save')} type="submit" />
      </div>
    </div>
  </form>
</Modal>

<style>
  .container {
    gap: 0.5rem;
  }
  @media (max-width: 400px) {
    .container {
      gap: 0.25rem;
    }
  }
  .tag {
    font-size: 1rem;
    cursor: pointer;
    border-radius: 10px;
    padding: 0.25rem 0.5rem;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    color: var(--primary-text-color);
    user-select: none;
  }
  .tag:focus,
  .tag:hover {
    opacity: 0.9;
  }
  .tag:active {
    opacity: 0.8;
  }
  .tag.selected {
    background-color: var(--active-color);
    color: var(--white-color);
  }
  .tag.add {
    border-style: dashed;
    background-color: transparent;
    border-color: var(--active-color);
    color: var(--active-color);
  }
</style>
