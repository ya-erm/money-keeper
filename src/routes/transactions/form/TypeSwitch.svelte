<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import MultiSwitch from '@ya-erm/svelte-ui/MultiSwitch';

  import { translate } from '$lib/translate';
  import { getSearchParam } from '$lib/utils';

  export let type: 'IN' | 'OUT' | 'TRANSFER' | string = getSearchParam($page, 'type') ?? 'OUT';
  export let disabled: boolean = false;

  const handleChange = async (option: { id: string; title: string }) => {
    type = option.id;
    $page.url.searchParams.set('type', option.id);
    await goto($page.url, { replaceState: true });
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
