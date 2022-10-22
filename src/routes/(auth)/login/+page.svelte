<script lang="ts">
  import { isApiError } from '$lib/api/ApiError';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast } from '$lib/ui/toasts';
  import { translate } from '$lib/translate';
  import type { ActionData } from './$types';

  export let form: ActionData;

  $: if (isApiError(form)) {
    switch (form.error.code) {
      case 'INCORRECT_LOGIN_OR_PASSWORD':
        showErrorToast($translate('auth.incorrect_login_or_password'));
        break;
      default:
        showErrorToast($translate('auth.failed_to_login'));
        break;
    }
  }
</script>

<FormContainer action="?/login">
  <Input label={$translate('auth.login')} name="login" required />
  <Input label={$translate('auth.password')} name="password" type="password" required autocomplete />
  <Button text={$translate('auth.sign_in')} type="submit" />
  <a slot="footer" href="/register">{$translate('auth.register')}</a>
</FormContainer>
