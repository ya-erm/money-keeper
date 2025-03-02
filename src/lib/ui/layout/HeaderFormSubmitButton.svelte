<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';

  import { translate } from '$lib/translate';

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

<Button appearance="transparent" onClick={handleSave} text={$translate('common.done')} />
