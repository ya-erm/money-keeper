<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';

  import { deps } from '$lib/deps';
  import { translate } from '$lib/translate';
  import MultiSwitch from '$lib/ui/MultiSwitch.svelte';
  import { getSearchParam } from '$lib/utils';

  export let type: 'IN' | 'OUT' | 'TRANSFER' | string = getSearchParam($page, 'type') ?? 'OUT';
  export let disabled: boolean = false;

  const handleChange = async (option: { id: string; title: string }) => {
    type = option.id;
    // $page.url.searchParams.set('type', option.id);
    // await goto($page.url, { replaceState: true });
    await invalidate(deps.categories);
  };

  const options = [
    { id: 'IN', title: $translate('transactions.incoming') },
    { id: 'OUT', title: $translate('transactions.outgoing') },
    { id: 'TRANSFER', title: $translate('transactions.transfer') },
  ];
</script>

<MultiSwitch
  selected={options.find((option) => option.id === type)}
  onChange={handleChange}
  testId="TypeSwitch"
  {options}
  {disabled}
/>
