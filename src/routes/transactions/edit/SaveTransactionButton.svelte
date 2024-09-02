<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';

  const handleSave = () => {
    document.querySelector('[data-testId=TransactionForm]')?.dispatchEvent(new Event('submit'));
  };
</script>

<Button appearance="transparent" underlined={false} on:click={handleSave} text={$translate('common.done')} />
