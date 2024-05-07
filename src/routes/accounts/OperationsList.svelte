<script lang="ts">
  import { operationsStore } from '$lib/data';
  import type { Account } from '$lib/data/interfaces';
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Input from '$lib/ui/Input.svelte';
  import ShowMoreContainer from '$lib/ui/ShowMoreContainer.svelte';
  import Spoiler from '$lib/ui/Spoiler.svelte';

  import FeatureOperationsSpoilerHeader from './FeatureOperationsSpoilerHeader.svelte';
  import GroupedOperationsList from './GroupedOperationsList.svelte';
  import { futureOperationsPredicate, pastOperationsPredicate } from './utils';

  export let account: Account | null = null;

  $: operations = $operationsStore;

  let search: string = '';
  let limit = 20;

  $: accountOperations = account ? operations.filter((t) => t.accountId === account?.id) : null;
  $: allFilteredOperations =
    (accountOperations ?? operations).filter(
      (t) =>
        !search ||
        t.comment?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(search.toLowerCase()) ||
        t.date.substring(0, 10).includes(search) ||
        t.tags.some((tag) => tag.name.toLowerCase().includes(search.toLowerCase())) ||
        `${t.amount} ${account?.currency}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  $: filteredOperations = allFilteredOperations.slice(0, limit);

  let featureOperationsHidden = true;

  $: pastOperations = filteredOperations.filter(pastOperationsPredicate());
  $: futureOperations = filteredOperations.filter(futureOperationsPredicate());
</script>

<ShowMoreContainer bind:limit step={20} total={allFilteredOperations.length}>
  <div class="operations-container p-1">
    <div class="flex gap-1">
      <h3 class="m-0 flex-grow font-normal">
        <span>{$translate('transactions.title')}</span>
        <span class="operations-count">
          {$translate('common.count', { values: { count: allFilteredOperations.length } })}
        </span>
      </h3>
      <a
        href={route('transactions.create') + (account?.id ? `?accountId=${account?.id}` : '')}
        data-testID="AddOperationButton"
      >
        {$translate('common.add')}
      </a>
    </div>
    <div class="operations-search-container flex gap-0.5">
      <div class="flex-grow">
        <Input bind:value={search} placeholder={$translate('common.search')} clearable />
      </div>
      <!-- 
    <Button appearance="transparent" bordered>
      <Icon size={1.25} name="mdi:filter" />
    </Button> 
    -->
    </div>
    {#if futureOperations.length > 0}
      <Spoiler hidden={featureOperationsHidden}>
        <FeatureOperationsSpoilerHeader
          slot="spoiler-header"
          bind:hidden={featureOperationsHidden}
          futureOperationsCount={futureOperations.length}
        />
        <GroupedOperationsList {account} operations={futureOperations} />
      </Spoiler>
      <hr class="line" />
    {/if}
    <GroupedOperationsList {account} operations={pastOperations} />
  </div>
</ShowMoreContainer>

<style>
  .operations-search-container {
    padding: 1rem 0;
    background: var(--background-color);
    position: relative;
  }
  .operations-count {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  .line {
    margin: 0;
    top: 0.5rem;
    position: relative;
    border: 0;
    border-top: 1px solid var(--border-color);
    height: 1px;
  }
</style>
