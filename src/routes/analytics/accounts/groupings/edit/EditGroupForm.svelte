<script lang="ts">
  import { v4 as uuid } from 'uuid';

  import type { Group, Grouping } from '$lib/data/interfaces';
  import { translate } from '$lib/translate';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';

  import GroupList from './GroupList.svelte';

  export let grouping: Grouping;

  export let onSave: (value: Grouping) => void;

  let id = grouping.id ?? uuid();
  let name = grouping.name ?? '';
  let groups: Group[] = JSON.parse(JSON.stringify(grouping.groups ?? []));

  const handleSave = () => onSave({ id, name, groups });
</script>

<form class="flex-col gap-1" data-testId="GroupingForm" on:submit|preventDefault={handleSave}>
  <Input label={$translate('analytics.groupings.name')} name="name" bind:value={name} required />
  <GroupList bind:groups />
  <Button text={$translate('common.save')} type="submit" />
</form>
