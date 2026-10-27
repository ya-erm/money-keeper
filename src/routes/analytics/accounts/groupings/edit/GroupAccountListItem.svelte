<script lang="ts">
  import { accountsStore } from '#lib/data/index.js';
  import { translate } from '#lib/translate/index.js';
  import Button from '@ya-erm/svelte-ui/Button';

  $: accounts = $accountsStore;

  export let accountId: string;
  export let onDelete: () => void;
</script>

<div class="flex justify-between">
  <span>
    {accounts.find((x) => x.id === accountId)?.name}
  </span>
  <Button color="danger" appearance="link" underlined={false} onClick={onDelete}>
    {$translate('common.delete')}
  </Button>
</div>
