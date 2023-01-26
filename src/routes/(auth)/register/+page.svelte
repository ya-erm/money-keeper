<script lang="ts">
  import { onDestroy } from 'svelte';

  import { isApiErrorData } from '$lib/api/ApiError';
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import LanguageButton from '$lib/translate/LanguageButton.svelte';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { rightButton } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  import type { ActionData } from './$types';

  export let form: ActionData;

  let password = '';
  let repeatPassword = '';

  const handleSubmit = (e: SubmitEvent) => {
    if (password !== repeatPassword) {
      showErrorToast($translate('auth.passwords_must_be_same'));
      e.preventDefault();
    }
  };

  $: if (isApiErrorData(form)) {
    switch (form.error.code) {
      case 'USER_ALREADY_EXISTS':
        showErrorToast($translate('auth.user_already_exists'));
        break;
      default:
        showErrorToast($translate('auth.failed_to_register'));
        break;
    }
  }

  rightButton.set(LanguageButton);
  onDestroy(() => rightButton.set(null));
</script>

<FormContainer action="?/register" onSubmit={handleSubmit}>
  <Input label={$translate('auth.name')} name="name" required />
  <Input label={$translate('auth.login')} name="login" required />
  <Input
    label={$translate('auth.password')}
    bind:value={password}
    name="password"
    type="password"
    minlength={6}
    autocomplete
    required
  />
  <Input
    label={$translate('auth.repeat_password')}
    bind:value={repeatPassword}
    type="password"
    minlength={6}
    required
  />
  <Button text={$translate('auth.register')} type="submit" />
  <a slot="footer" href={routes.login.path}>{$translate('auth.sign_in')}</a>
</FormContainer>
