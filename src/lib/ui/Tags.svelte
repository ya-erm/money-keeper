<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from './Button.svelte';
  import Input from './Input.svelte';
  import Modal from './Modal.svelte';

  export let tags: { id: string; title: string }[];
  export let selected: string[];
  export let onChange: (id: string, selected: boolean) => void;
  export let onAdd: (title: string) => Promise<void> | void;

  let title = '';
  let opened = false;
  const handleOpenModal = () => {
    title = '';
    opened = true;
  };
  const handleAdd = async () => {
    await onAdd(title);
    opened = false;
  };
</script>

<div class="flex flex-wrap gap-0.5" data-testId="TagsContainer">
  {#each tags as tag (tag.id)}
    {@const isSelected = selected.includes(tag.id)}
    <button class="tag" class:selected={isSelected} type="button" on:click={() => onChange(tag.id, !isSelected)}>
      {tag.title}
    </button>
  {/each}
  <button class="tag add" type="button" on:click={handleOpenModal} data-testId="AddTagButton">
    {$translate('common.add')}
  </button>
</div>

<Modal {opened} header={$translate('common.tags.modal_header')}>
  <form on:submit|preventDefault={handleAdd} class="flex-col gap-1" data-testId="AddTagForm">
    <Input label={$translate('common.tags.title')} bind:value={title} name="title" required />
    <div class="flex gap-1">
      <div class="flex-col flex-1">
        <Button color="secondary" on:click={() => (opened = false)} text={$translate('common.cancel')} />
      </div>
      <div class="flex-col flex-1">
        <Button text={$translate('common.add')} type="submit" />
      </div>
    </div>
  </form>
</Modal>

<style>
  .tag {
    font-size: 1rem;
    cursor: pointer;
    border-radius: 10px;
    padding: 0.25rem 0.5rem;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
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
