<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import dayjs from 'dayjs';

  import type { CategoryType, ImportTransactionItem, TransactionWithAccountAndCategory } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';

  import AccountSelect from '../AccountSelect.svelte';
  import TransactionListItem from '../TransactionListItem.svelte';

  import type { PageData } from './$types';
  import SelectCategoryModal from './SelectCategoryModal.svelte';
  import { keyTransactions } from '$lib/utils';

  export let data: PageData;
  $: accounts = data.accounts;
  $: categories = data.categories;
  $: transactionKeys = new Set(data.transactionKeys);

  $: accountId = parseInt($page.url.searchParams.get('accountId') ?? '') || null;
  $: account = accounts.find(({ id }) => id === accountId);

  let items: Array<ImportTransactionItem> = [];

  let fileInput: HTMLInputElement;
  const onFileChange = () => {
    if (fileInput.files?.length !== 1) return;
    const file = fileInput.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(file);
    fileReader.onload = function (e) {
      const content = e.target?.result;
      if (!content || typeof content !== 'string') {
        showErrorToast('Failed to read file');
        return;
      }
      const { keyedItems } = keyTransactions(JSON.parse(content));
      items = keyedItems
        .filter((item) => !transactionKeys.has(item.uniqueKey))
        .map((item: any) => ({
          ...item,
          checked: true,
          categoryId: null,
        }));
    };
  };

  let search: string = '';

  $: categoryIdParam = $page.url.searchParams.get('categoryId');
  $: categoryId = categoryIdParam ? parseInt(categoryIdParam) || null : undefined;

  $: filteredItems = items
    .filter((x) => categoryId === undefined || x.categoryId === categoryId)
    .filter((item) => !!item.comment?.toLowerCase().includes(search.toLowerCase()));

  $: groups = filteredItems.reduce((res, t) => {
    const date = dayjs(t.date).format('YYYY-MM-DD');
    if (!res[date]) res[date] = [];
    res[date].push(t);
    return res;
  }, {} as { [key: string]: Array<ImportTransactionItem> });

  let categoriesType: CategoryType = 'OUT';

  let applyCategoryModalOpened = false;

  const handleSetCategoryClick = () => {
    const checkedFilteredItems = filteredItems.filter((item) => item.checked);
    const incomings = checkedFilteredItems.some((item) => item.type === 'IN');
    const outgoings = checkedFilteredItems.some((item) => item.type === 'OUT');
    if (incomings && outgoings) {
      showErrorToast($translate('transactions.import.invalid_expression'));
      return;
    }
    categoriesType = incomings ? 'IN' : 'OUT';
    applyCategoryModalOpened = true;
  };

  const setCategoryForFilteredItems = (categoryId: number) => {
    // TODO: show confirmation modal when override categories
    const checkedFilteredItems = filteredItems.filter((item) => item.checked);
    checkedFilteredItems.forEach((item) => {
      item.categoryId = categoryId;
    });
    items = [...items];
    showSuccessToast(
      $translate('transactions.import.category_applied', {
        values: {
          category: categories.find((x) => x.id === categoryId)?.name,
          count: checkedFilteredItems.length,
        },
      }),
    );
  };

  let changeCategoryModalOpened = false;

  let selectedOperation: TransactionWithAccountAndCategory | null;

  const handleOperationClick = (transaction: TransactionWithAccountAndCategory) => {
    categoriesType = transaction.category.type as CategoryType;
    selectedOperation = transaction;
    changeCategoryModalOpened = true;
  };

  const changeOperationCategory = (categoryId: number) => {
    const index = items.findIndex((item) => `${item.id}` === `${selectedOperation?.id}`);
    items[index].categoryId = categoryId;
    items = [...items];
  };

  const filterByCategory = (value: number | null) => {
    if (categoryId !== value) {
      $page.url.searchParams.set('categoryId', `${value}`);
    } else {
      $page.url.searchParams.delete('categoryId');
    }
    goto($page.url, { replaceState: true });
  };

  const handleFinishClick = async () => {
    const checkedItems = items.filter((item) => item.checked);

    // if (checkedItems.some((item) => !item.categoryId)) {
    //   showErrorToast($translate('transactions.import.select_category_for_all_operations'));
    // }

    const response = await fetch(`/api/transactions/import?accountId=${accountId}`, {
      method: 'POST',
      body: JSON.stringify({ items: checkedItems }),
    });

    if (response.status === 200) {
      const data = await response.json();
      showSuccessToast($translate('transactions.import.finished', { values: { count: data.count } }));
    }
  };
</script>

{#if !account}
  <AccountSelect {accounts} fromUrl />
{:else}
  <div class="container p-1 flex-col gap-1">
    <div>
      <input bind:this={fileInput} type="file" on:change={onFileChange} />
    </div>
    <div class="flex gap-1">
      <div class="flex-grow">
        <Input bind:value={search} placeholder={$translate('common.search')} clearable />
      </div>
      <Button on:click={handleSetCategoryClick} text={$translate('transactions.import.set_category')} />
    </div>
    <div class="list flex-grow flex-col gap-1">
      {#each Object.entries(groups) as [date, items] (`${date}`)}
        <div>{date}</div>
        {#each items as item (`${item.id} ${item.date} ${item.amount}`)}
          <div class="flex gap-1 items-cetner" id={item.id} data-uniqueKey={item.uniqueKey}>
            <Checkbox bind:checked={item.checked} />
            <TransactionListItem
              hideAccount
              onClick={handleOperationClick}
              transaction={{
                // @ts-ignore
                id: item.id,
                comment: item.comment ?? null,
                amount: item.amount,
                date: item.date,
                // @ts-ignore
                category: item.categoryId
                  ? categories.find((c) => c.id === item.categoryId)
                  : {
                      type: item.type,
                      name: $translate('transactions.import.no_category'),
                      icon: 'bi:question-lg',
                    },
                account,
              }}
            />
          </div>
        {/each}
      {/each}
    </div>
    <div class="category-filters">
      {#each categories as category (category.id)}
        {@const categoryItems = items.filter((x) => x.categoryId === category.id)}
        {#if categoryItems.length > 0}
          <Button
            appearance="link"
            underlined={categoryId === category.id}
            on:click={() => filterByCategory(category.id)}
          >
            {category.name}:&nbsp;{categoryItems.length}
          </Button>
        {/if}
      {/each}
      <Button color="danger" appearance="link" underlined={categoryId === null} on:click={() => filterByCategory(null)}>
        {$translate('transactions.import.no_category')}: {items.filter((x) => !x.categoryId).length}
      </Button>
    </div>
    <Button on:click={handleFinishClick} text={$translate('transactions.import.finish')} />
  </div>
  <SelectCategoryModal
    type={categoriesType}
    header={$translate('transactions.import.select_category_multi_title', { values: { count: filteredItems.length } })}
    bind:opened={applyCategoryModalOpened}
    onSave={setCategoryForFilteredItems}
    {categories}
  />
  <SelectCategoryModal
    type={categoriesType}
    header={$translate('transactions.import.select_category_title')}
    categoryId={selectedOperation?.category?.id}
    bind:opened={changeCategoryModalOpened}
    onSave={changeOperationCategory}
    {categories}
  />
{/if}

<style>
  .container {
    height: 100%;
  }
  .list {
    overflow-y: auto;
  }
  .category-filters {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
  }
</style>
