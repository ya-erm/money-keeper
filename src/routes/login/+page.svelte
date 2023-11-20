<script lang="ts">
  import { goto } from '$app/navigation';
  import { derived } from 'svelte/store';

  import { ApiError, isApiError } from '$lib/api/ApiError';
  import { journalService, mainService, membersService } from '$lib/data';
  import { createKeyFromPassword, decryptAes, decryptRsa } from '$lib/data/crypto';
  import type {
    LoginConfirmRequestData,
    LoginConfirmResponseData,
    LoginRequestData,
    LoginResponseData,
  } from '$lib/server/api/v2/auth';
  import { translate } from '$lib/translate';
  import LanguageButton from '$lib/translate/LanguageButton.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Loader from '$lib/ui/Loader.svelte';
  import { useRightButton, useTitle } from '$lib/ui/header';
  import { showErrorToast } from '$lib/ui/toasts';
  import { useFetch, useSmartLoading } from '$lib/utils';

  useTitle($translate('auth.login.title'));
  useRightButton(LanguageButton);

  let login = '';
  let password = '';

  const loginFetcher = useFetch<LoginRequestData, LoginResponseData>('POST', '/api/v2/auth/login');
  const loginConfirmFetcher = useFetch<LoginConfirmRequestData, LoginConfirmResponseData>(
    'POST',
    '/api/v2/auth/login/confirm',
  );
  const smartLoading = useSmartLoading(
    derived([loginFetcher.loading, loginConfirmFetcher.loading], ([a, b]) => a || b),
  );

  /** @throws error "Incorrect login or password" if failed to decrypt key */
  async function tryDecryptAes(...params: Parameters<typeof decryptAes>) {
    try {
      return await decryptAes(...params);
    } catch (e) {
      throw new ApiError(403, 'INCORRECT_LOGIN_OR_PASSWORD');
    }
  }

  async function decryptKey(encryptedKey: Record<string, any>) {
    switch (encryptedKey.version) {
      case '1.0.0': {
        const { salt, base64Data, initialVector } = encryptedKey;
        const { jwk } = await createKeyFromPassword(password, salt);
        return await tryDecryptAes(jwk, base64Data, initialVector);
      }
      default:
        throw new Error(`Unsupported encryption version "${encryptedKey.version}"`);
    }
  }

  /** @returns true, if error handling was successful */
  function tryHandleError(e: unknown) {
    if (!isApiError(e)) return false;
    switch (e.code) {
      case 'USER_NOT_FOUND':
      case 'INCORRECT_LOGIN_OR_PASSWORD':
        showErrorToast($translate('auth.incorrect_login_or_password'), { testId: 'IncorrectLoginOrPasswordToast' });
        return true;
      default:
        return false;
    }
  }

  async function handleSubmit() {
    try {
      const data = await loginFetcher.fetch({ login });
      const { member, encryptedToken } = data;
      if (!member?.encryptedKey) {
        throw new Error('Encrypted key not found');
      }
      const encryptedKey = JSON.parse(member.encryptedKey);
      const decryptedKey = await decryptKey(encryptedKey);
      // Save member to local DB
      await membersService.save({
        login,
        uuid: member.uuid,
        publicKey: member.publicKey,
        privateKey: decryptedKey,
      });
      // eslint-disable-next-line no-undef
      const privateKey: JsonWebKey = JSON.parse(decryptedKey);
      const decryptedToken = await decryptRsa(privateKey, encryptedToken.base64Data);
      await loginConfirmFetcher.fetch({ token: decryptedToken, uuid: member.uuid });
      // Initialize main service asynchronously
      await mainService.initServices();
      // Fetch updates from server
      journalService.syncWithServer();
      // Go to default route
      goto('/');
    } catch (e) {
      if (!tryHandleError(e)) {
        console.error(e);
        showErrorToast($translate('auth.failed_to_login'));
      }
    }
  }
</script>

<div class="content">
  <form on:submit|preventDefault={handleSubmit}>
    <Input label={$translate('auth.login')} bind:value={login} name="login" testId="LoginInput" required />
    <Input
      label={$translate('auth.password')}
      bind:value={password}
      testId="PasswordInput"
      name="password"
      type="password"
      autocomplete
      required
    />
    <Button text={$translate('auth.sign_in')} type="submit" testId="SignInButton" />
    <a class="flex-center" href="/register">{$translate('auth.register')}</a>
    <Loader visible={$smartLoading} />
  </form>
</div>

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
