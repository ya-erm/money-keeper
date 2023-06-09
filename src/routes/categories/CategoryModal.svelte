<script lang="ts">
  import type { Category, CategoryType } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { v4 as uuid } from 'uuid';

  export let opened: boolean;
  export let category: Category | null = null;
  export let categoryType: CategoryType;

  export let onSave: (category: Category) => void | Promise<void>;
  export let onDelete: ((category: Category) => void | Promise<void>) | null = null;

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
    await onDelete?.(category);
    opened = false;
  };
</script>

<Modal width={20} header={category?.name ?? $translate('categories.new_category')} bind:opened>
  <form class="flex-col gap-1" on:submit|preventDefault={handleSave}>
    <Input label={$translate('categories.name')} name="name" bind:value={name} required />
    <Input label={$translate('categories.icon')} name="icon" bind:value={icon} optional>
      <a slot="end" href="https://icon-sets.iconify.design/" target="_blank" rel="noopener noreferrer">
        <Icon name="mdi:open-in-new" padding={0.5} />
      </a>
    </Input>
    <div class="grid-col-2 gap-1">
      {#if !!category && onDelete}
        <Button color="danger" text={$translate('common.delete')} on:click={handleDelete} />
      {:else}
        <Button color="secondary" text={$translate('common.cancel')} on:click={() => (opened = false)} />
      {/if}
      <Button text={$translate('common.save')} type="submit" />
    </div>
  </form>
</Modal>
