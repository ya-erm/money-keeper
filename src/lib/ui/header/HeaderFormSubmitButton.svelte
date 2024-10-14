<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';

  const handleSave = () => {
    const form = document.querySelector('form');
    const submitButton = form?.querySelector("button[type='submit']") as HTMLButtonElement;
    if (submitButton) {
      submitButton.click();
    } else {
      form?.dispatchEvent(new Event('submit'));
    }
  };
</script>

<Button appearance="transparent" on:click={handleSave} text={$translate('common.done')} />
