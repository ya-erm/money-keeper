<script lang="ts">
  import { goto } from '$app/navigation';
  import { createKeyFromPassword, encryptAes, generateRsaKeys } from '$lib/data/crypto';
  import { route } from '$lib/routes';
  import type { RegisterRequestData, RegisterResponseData } from '$lib/server/api/v2/auth';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Loader from '$lib/ui/Loader.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { showErrorToast, showSuccessToast } from '$lib/ui/toasts';
  import { useFetch } from '$lib/utils/useFetch';
  import { v4 as uuid } from 'uuid';

  export let login: string;
  export let opened = false;

  let password = '';
  let repeatPassword = '';

  const { fetch: register, loading } = useFetch<RegisterRequestData, RegisterResponseData>(
    'POST',
    '/api/v2/auth/register',
  );

  const encryptKey = async () => {
    if (password !== repeatPassword) {
      showErrorToast($translate('auth.passwords_must_be_same'));
      return;
    }

    const { publicKey, privateKey } = await generateRsaKeys();

    const { jwk, salt } = await createKeyFromPassword(password);

    const pk = JSON.stringify(privateKey);

    const { base64Data, initialVector } = await encryptAes(jwk, pk);

    const encryptedKey = {
      version: '1.0.0',
      salt,
      base64Data,
      initialVector,
    };

    try {
      await register({
        login,
        uuid: uuid(),
        publicKey: JSON.stringify(publicKey),
        encryptedKey,
      });
      opened = false;
      showSuccessToast($translate('auth.registration_success'));
      await goto(route('login'));
    } catch (e) {
      console.error(e);
      showErrorToast($translate('auth.registration_failure'));
    }
  };
</script>

<Modal width={25} bind:opened header={$translate('auth.password')}>
  <form on:submit|preventDefault={encryptKey} class="flex-col gap-1">
    <input class="hidden" name="login" value={login} />
    <Input
      label={$translate('auth.password')}
      bind:value={password}
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
      autocomplete
      required
    />
    {#if $loading}
      <Loader visible={$loading} />
    {:else}
      <Button type="submit">
        {$translate('common.continue')}
      </Button>
    {/if}
  </form>
</Modal>
