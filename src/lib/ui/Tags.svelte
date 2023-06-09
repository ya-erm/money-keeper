<script lang="ts">
  import { translate } from '$lib/translate';
  import { longPress } from '$lib/utils';
  import Button from './Button.svelte';
  import Input from './Input.svelte';
  import Modal from './Modal.svelte';

  export let tags: { id: string; title: string }[];
  export let selected: string[];
  export let readOnly: boolean = false;
  export let onChange: ((id: string, selected: boolean) => void) | null = null;
  export let onAdd: ((title: string) => Promise<void> | void) | null = null;
  export let onEdit: ((id: string, title: string) => Promise<void> | void) | null = null;
  export let onDelete: ((id: string) => Promise<void> | void) | null = null;

  let id = '';
  let title = '';
  let opened = false;
  let mode: 'add' | 'edit' = 'add';

  const handleOpenModal = (item: { id: string; title: string } | null) => {
    if (readOnly) return;
    mode = item ? 'edit' : 'add';
    title = item?.title ?? '';
    id = item?.id ?? '';
    opened = true;
  };

  const handleSubmit = async () => {
    if (mode === 'add') {
      await onAdd?.(title);
    } else {
      await onEdit?.(id, title);
    }
    opened = false;
  };

  const handleDelete = async () => {
    await onDelete?.(id);
    opened = false;
  };

  const handleChange = (id: string, checked: boolean) => {
    if (onChange) {
      onChange(id, checked);
    } else {
      selected = checked ? [...selected, id] : selected.filter((t) => t !== id);
    }
  };
</script>

<div class="flex flex-wrap container" data-testId="TagsContainer">
  {#each tags as tag (tag.id)}
    {@const isSelected = selected.includes(tag.id)}
    <button
      class="tag"
      type="button"
      class:selected={isSelected}
      on:click={() => handleChange(tag.id, !isSelected)}
      use:longPress={() => handleOpenModal(tag)}
    >
      {tag.title}
    </button>
  {/each}
  {#if !readOnly}
    <button class="tag add" type="button" on:click={() => handleOpenModal(null)} data-testId="AddTagButton">
      {$translate('common.add')}
    </button>
  {/if}
</div>

{#if !readOnly}
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
{/if}

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
