<script lang="ts">
  import { v4 as uuid } from 'uuid';

  import type { Category, CategoryType } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Layout from '$lib/ui/Layout.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import MultiSwitch from '$lib/ui/MultiSwitch.svelte';
  import Portal from '$lib/ui/Portal.svelte';

  import CategoryIcons from './CategoryIcons.svelte';
  import { categoryDataList, type CategorySuggestionMessage } from './datalist';

  export let opened: boolean;
  export let category: Category | null = null;
  export let categoryType: CategoryType = category?.type ?? 'OUT';

  export let onSave: (category: Category) => void | Promise<void>;
  export let onDelete: ((category: Category) => void | Promise<void>) | null = null;

  let name = category?.name ?? '';
  let icon = category?.icon ?? null;

  let suggestedIcon: string | null = null;
  const suggestions = Object.keys(categoryDataList).sort() as CategorySuggestionMessage[];

  const handleNameChanged = (value: string) => {
    const suggestionId = suggestions.find((message) => $translate(message) === value);
    if (suggestionId) {
      suggestedIcon = categoryDataList[suggestionId];
    }
  };

  const handleSave = async () => {
    await onSave({
      ...category,
      id: category?.id ?? uuid(),
      type: categoryType,
      name,
      icon: icon ?? suggestedIcon ?? null,
    });
    opened = false;
  };

  const handleDelete = async () => {
    if (!category) return;
    await onDelete?.(category);
    opened = false;
  };

  const options = [
    { id: 'IN', title: $translate('categories.incoming') },
    { id: 'OUT', title: $translate('categories.outgoing') },
  ];
  const selectedOption = options.find(({ id }) => id == categoryType);
  const handleChangeType = ({ id }: { id: string }) => {
    categoryType = id as CategoryType;
  };

  let iconSelecting = false;
</script>

<Modal
  width={20}
  header={category?.name ?? $translate('categories.new_category')}
  opened={opened && !iconSelecting}
  on:close={() => (opened = false)}
>
  <form class="flex-col gap-1 items-center" on:submit|preventDefault={handleSave}>
    <MultiSwitch {options} selected={selectedOption} onChange={handleChangeType} />
    <div class="w-full flex gap-1 items-center">
      <Input
        label={$translate('categories.name')}
        list="categories"
        bind:value={name}
        onChange={handleNameChanged}
        required
        v2
      />
      <div class="flex-col gap-0.5">
        <GridCircleItem icon={icon || suggestedIcon || 'mdi:folder-outline'} onClick={() => (iconSelecting = true)} />
      </div>
    </div>
    <div class="w-full grid-col-2 gap-1">
      {#if !!category && onDelete}
        <Button color="danger" text={$translate('common.delete')} on:click={handleDelete} />
      {:else}
        <Button color="secondary" text={$translate('common.cancel')} on:click={() => (opened = false)} />
      {/if}
      <Button text={$translate('common.save')} type="submit" />
    </div>
  </form>
</Modal>

<Portal visible={iconSelecting}>
  <Layout
    header={{
      backButton: {
        onClick: () => (iconSelecting = false),
      },
      leftButton: null,
      rightButton: null,
      title: $translate('categories.icon'),
    }}
  >
    <CategoryIcons
      icon={icon ?? null}
      onSelect={(value) => {
        iconSelecting = false;
        icon = value;
      }}
    />
  </Layout>
</Portal>

<datalist id="categories">
  {#each suggestions as option}
    <option value={$translate(option)} />
  {/each}
</datalist>
