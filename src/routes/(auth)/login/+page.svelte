<script lang="ts">
  import { applyAction } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { ActionResult } from '@sveltejs/kit';

  import { isApiErrorData } from '$lib/api/ApiError';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  import type { ActionData } from './$types';

  export let form: ActionData;

  $: if (isApiErrorData(form)) {
    switch (form.error.code) {
      case 'INCORRECT_LOGIN_OR_PASSWORD':
        showErrorToast($translate('auth.incorrect_login_or_password'));
        break;
      default:
        showErrorToast($translate('auth.failed_to_login'));
        break;
    }
  }

  const handleResult = (result: ActionResult) => {
    invalidateAll();
    applyAction(result);
  };
</script>

<FormContainer action="?/login" onResult={handleResult}>
  <Input label={$translate('auth.login')} name="login" required />
  <Input label={$translate('auth.password')} name="password" type="password" required autocomplete />
  <Button text={$translate('auth.sign_in')} type="submit" />
  <a slot="footer" href="/register">{$translate('auth.register')}</a>
</FormContainer>
