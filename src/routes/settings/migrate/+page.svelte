<script lang="ts">
  import type { Account, Category, CategoryType, CurrencyRate, Tag, Transaction } from '$lib/data/interfaces';
  import type { PageData } from './$types';
  import { v4 as uuid } from 'uuid';

  export let data: PageData;

  let v2: {
    categories: Category[];
    accounts: Account[];
    tags: Tag[];
    transactions: Transaction[];
    currencyRates: CurrencyRate[];
  } = {
    categories: [],
    accounts: [],
    tags: [],
    transactions: [],
    currencyRates: [],
  };

  function mapCategoryType(value: string): CategoryType {
    switch (value) {
      case 'IN':
        return 'IN';
      case 'OUT':
        return 'OUT';
      default:
        throw new Error(`Unsupported category type: ${value}`);
    }
  }

  function migrate() {
    const accounts = data.accounts.map((item) => ({ ...item, uuid: uuid() }));
    const categories = data.categories.map((item) => ({ ...item, uuid: uuid() }));
    const transactions = data.transactions.map((item) => ({ ...item, uuid: uuid() }));
    const currencyRates = data.currencyRates.map((item) => ({ ...item, uuid: uuid() }));
    const tags = data.tags.map((item) => ({ ...item, uuid: uuid() }));

    const uuids = new Map<string, any>();
    [accounts, categories, transactions, currencyRates, tags].forEach((arr) =>
      arr.forEach((item) => {
        if (uuids.has(item.uuid)) {
          throw new Error(`Duplicate uuid: ${item.uuid}`);
        }
        uuids.set(item.uuid, item);
      }),
    );

    v2 = {
      categories: categories.map(({ uuid, icon, name, type }) => ({
        id: uuid,
        name,
        icon,
        type: mapCategoryType(type),
      })),

      accounts: accounts.map(({ uuid, icon, name, currency, order }) => ({
        id: uuid,
        icon,
        name,
        currency,
        order,
      })),

      tags: tags.map(({ uuid, name }) => ({
        id: uuid,
        name,
      })),

      transactions: transactions.map(
        ({ uuid, accountId, categoryId, amount, comment, date, tags: _tags, linkedTransactionId }) => ({
          id: uuid,
          accountId: accounts.find((x) => x.id === accountId)!.uuid,
          categoryId: categories.find((x) => x.id === categoryId)!.uuid,
          amount,
          comment,
          date,
          tagIds: _tags.map((t) => tags.find((x) => x.id === t.id)!.uuid),
          ...(linkedTransactionId
            ? {
                linkedTransactionId: transactions.find((t) => t.id === linkedTransactionId)!.uuid,
              }
            : {}),
          // description,
        }),
      ),

      currencyRates: currencyRates.map(({ uuid, cur1, cur2, rate }) => ({
        id: uuid,
        cur1,
        cur2,
        rate,
      })),
    };
  }
</script>

<div class="container p-1">
  <label>
    <span>RAW Data:</span>
    <textarea class="text-area-json" value={JSON.stringify(data)} />
  </label>
  <p>
    <span>Tags: <b>{data.tags.length}</b>,</span>
    <span>Categories: <b>{data.categories.length}</b>,</span>
    <span>Accounts: <b>{data.accounts.length}</b>,</span>
    <span>Transactions: <b>{data.transactions.length}</b>,</span>
    <span>CurrencyRates: <b>{data.currencyRates.length}</b></span>
  </p>

  <button style:width="100%" on:click={migrate}>Migrate</button>

  <label>
    <span>V2 Data:</span>
    <textarea class="text-area-json" value={JSON.stringify(v2)} />
  </label>
  <p>
    <span>Tags: <b>{v2.tags.length}</b>,</span>
    <span>Categories: <b>{v2.categories.length}</b>,</span>
    <span>Accounts: <b>{v2.accounts.length}</b>,</span>
    <span>Transactions: <b>{v2.transactions.length}</b>,</span>
    <span>CurrencyRates: <b>{v2.currencyRates.length}</b></span>
  </p>
</div>

<style>
  .container {
    height: 100%;
  }
  .text-area-json {
    width: 100%;
    height: 25%;
  }
</style>
