<script lang="ts">
  import { goto, invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { deps } from '$lib/deps';
  import { translate } from '$lib/translate';
  import MultiSwitch from '$lib/ui/MultiSwitch.svelte';

  $: type = $page.url.searchParams.get('type') ?? 'OUT';

  const handleChange = async (option: { id: string; title: string }) => {
    $page.url.searchParams.set('type', option.id);
    await goto($page.url, { replaceState: true });
    await invalidate(deps.categories);
  };

  const options = [
    { id: 'IN', title: $translate('transactions.incoming') },
    { id: 'OUT', title: $translate('transactions.outgoing') },
  ];
</script>

<MultiSwitch
  {options}
  selected={options.find((option) => option.id === type)}
  on:change={(e) => handleChange(e.detail)}
/>
