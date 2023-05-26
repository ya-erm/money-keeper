<script lang="ts">
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';

  import TransactionListItem from './TransactionListItem.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: transactions = data.transactions;
</script>

<div class="p-1">
  <a class="flex-col" href={routes['transactions.create'].path}>
    <Button>
      <Icon name="mdi:plus" />
      {$translate('transactions.new_transaction')}
    </Button>
  </a>
</div>
<div class="p-1 flex-col gap-1">
  {#each transactions as transaction}
    <TransactionListItem {transaction} />
  {/each}
</div>
