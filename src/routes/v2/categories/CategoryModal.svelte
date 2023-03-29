<script lang="ts">
  import Modal from '$lib/ui/Modal.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import type { Category, CategoryType } from '$lib/data/interfaces';
  import { v4 as uuid } from 'uuid';

  export let opened: boolean;
  export let category: Category | null = null;
  export let categoryType: CategoryType;

  export let onSave: (category: Category) => void | Promise<void>;
  export let onDelete: (category: Category) => void | Promise<void>;

  let name = category?.name ?? '';
  let icon = category?.icon;

  const handleSave = async () => {
    await onSave({
      ...category,
      id: category?.id ?? uuid(),
      type: categoryType,
      name,
      icon,
    });
    opened = false;
  };

  const handleDelete = async () => {
    if (!category) return;
    await onDelete(category);
    opened = false;
  };
</script>

<Modal width={15} header={category?.name ?? $translate('categories.new_category')} bind:opened>
  <form class="flex-col gap-1" on:submit|preventDefault={handleSave}>
    <Input label={$translate('categories.name')} name="name" bind:value={name} required />
    <Input label={$translate('categories.icon')} name="icon" bind:value={icon} optional />
    <div class="grid-col-2 gap-1">
      {#if !!category}
        <Button color="danger" text={$translate('common.delete')} on:click={handleDelete} />
      {:else}
        <Button color="secondary" text={$translate('common.cancel')} on:click={() => (opened = false)} />
      {/if}
      <Button text={$translate('common.save')} type="submit" />
    </div>
  </form>
</Modal>
