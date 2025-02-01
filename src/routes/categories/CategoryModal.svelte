<script lang="ts">
  import { page } from '$app/stores';
  import { v4 as uuid } from 'uuid';

  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import MultiSwitch from '@ya-erm/svelte-ui/MultiSwitch';
  import Portal from '@ya-erm/svelte-ui/Portal';

  import type { Category, CategoryType } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';
  import Layout from '$lib/ui/Layout.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { deleteSearchParam, getSearchParam, setSearchParam } from '$lib/utils';

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

  $: iconSelectingParam = getSearchParam($page, 'iconSelecting');
  $: iconSelecting = iconSelectingParam === 'true';
  $: if (iconSelectingParam === 'true') {
    iconSelecting = true;
  }
  $: if (!!iconSelectingParam && !iconSelecting) {
    void deleteSearchParam($page, 'iconSelecting');
  }
  const openIconSelecting = async () => {
    await setSearchParam($page, 'iconSelecting', 'true', { replace: false });
  };
  const closeIconSelecting = async () => {
    history.back();
    await deleteSearchParam($page, 'iconSelecting');
  };
</script>

<Modal width={20} header={category?.name ?? $translate('categories.new_category')} bind:opened>
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
      <datalist id="categories">
        {#each suggestions as option}
          <option value={$translate(option)}></option>
        {/each}
      </datalist>
      <div class="flex-col gap-0.5">
        <GridCircleItem icon={icon || suggestedIcon || 'mdi:folder-outline'} onClick={openIconSelecting} />
      </div>
    </div>
    <div class="w-full grid-col-2 gap-1">
      {#if !!category && onDelete}
        <Button color="danger" text={$translate('common.delete')} onClick={handleDelete} />
      {:else}
        <Button color="secondary" text={$translate('common.cancel')} onClick={() => (opened = false)} />
      {/if}
      <Button text={$translate('common.save')} type="submit" />
    </div>
  </form>

  <Portal visible={iconSelecting}>
    <Layout
      header={{
        backButton: {
          onClick: closeIconSelecting,
        },
        leftButton: null,
        rightButton: null,
        title: $translate('icons.select_icon'),
      }}
      hideMenu
    >
      <CategoryIcons
        icon={icon ?? null}
        onSelect={(value) => {
          void closeIconSelecting();
          icon = value;
        }}
      />
    </Layout>
  </Portal>
</Modal>
