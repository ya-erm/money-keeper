<script lang="ts">
  import { v4 as uuid } from 'uuid';

  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import Portal from '@ya-erm/svelte-ui/Portal';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';

  import { accountsStore } from '$lib/data';
  import type { Group } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AccountList from '../../../../accounts/list/AccountList.svelte';
  import GroupAccountList from './GroupAccountList.svelte';

  $: accounts = $accountsStore;

  export let groups: Group[];

  const addGroup = () => {
    groups = groups.concat({
      id: uuid(),
      name: '',
      accountIds: [],
    });
  };

  const deleteGroup = (id: string) => {
    groups = groups.filter((item) => item.id !== id);
  };

  let groupIdForAddAccount: string | null = null;

  const addAccountToGroup = (groupId: string) => {
    groupIdForAddAccount = groupId;
  };

  const handelSelectAccount = ({ id }: { id: string }) => {
    const group = groups.find((item) => item.id === groupIdForAddAccount);
    if (!group) {
      showErrorToast($translate('analytics.groupings.groups.accounts.failed_to_add'));
      return;
    }
    if (!group.accountIds?.includes(id)) {
      group.accountIds = (group.accountIds ?? []).concat(id);
    }
    groups = groups.map((g) => (g.id === group.id ? group : g));
    groupIdForAddAccount = null;
  };
</script>

<div class="groups flex-col gap-0.5">
  <InputLabel text={$translate('analytics.groupings.groups')} />
  <ul class="flex-col gap-1">
    {#each groups as group (group.id)}
      <li class="group flex-col gap-1">
        <Input label={$translate('analytics.groupings.groups.name')} bind:value={group.name} required />
        <Input label={$translate('analytics.groupings.groups.color')} bind:value={group.color} type="color" required />
        <GroupAccountList bind:group onAddAccountToGroup={addAccountToGroup} />
        <Button color="danger" appearance="link" underlined={false} onClick={() => deleteGroup(group.id)}>
          {$translate('analytics.groupings.groups.delete')}
        </Button>
      </li>
    {/each}
    <Button color="white" onClick={addGroup}>
      {$translate('analytics.groupings.groups.add')}
    </Button>
  </ul>
</div>

<Portal visible={!!groupIdForAddAccount} testId={`Grouping.AccountSelecting.Portal`}>
  <Layout title={$translate('transactions.select_account')} onBack={() => (groupIdForAddAccount = null)} hideMenu>
    <AccountList {accounts} onClick={handelSelectAccount} />
  </Layout>
</Portal>

<style>
  .groups > ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .group {
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 10px;
  }
</style>
