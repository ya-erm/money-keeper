<script lang="ts">
  import { accountsStore } from '$lib/data';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';

  $: accounts = $accountsStore;

  export let accountId: string;
  export let onDelete: () => void;
</script>

<div class="flex justify-between">
  <span>
    {accounts.find((x) => x.id === accountId)?.name}
  </span>
  <Button color="danger" appearance="link" underlined={false} on:click={onDelete}>
    {$translate('common.delete')}
  </Button>
</div>
