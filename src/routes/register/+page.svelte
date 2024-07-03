<script lang="ts">
  import { translate } from '$lib/translate';
  import LanguageButton from '$lib/translate/LanguageButton.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { useRightButton, useTitle } from '$lib/ui/header';

  import PasswordModal from './PasswordModal.svelte';

  useTitle($translate('auth.register.title'));
  useRightButton(LanguageButton);

  let login = '';

  let opened = false;

  async function handleSubmit() {
    opened = true;
  }
</script>

<div class="content">
  <form on:submit|preventDefault={handleSubmit}>
    <Input label={$translate('auth.login')} bind:value={login} name="login" required />
    <Button text={$translate('common.continue')} type="submit" />
  </form>
  <a class="flex-center" href="/login">{$translate('auth.sign_in')}</a>
  <a class="flex-center" href="/">{$translate('auth.continue_as_guest')}</a>
</div>

<PasswordModal {login} bind:opened />

<style>
  .content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }
  form {
    max-width: min(100%, calc(100vw - 4rem));
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
