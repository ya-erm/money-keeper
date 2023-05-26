<script lang="ts">
  import { createKeyFromPassword, encryptAes, generateRsaKeys } from '$lib/data/crypto';
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

  let step = 1;

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
      showSuccessToast($translate('common.save_changes_success'));
    } catch (e) {
      showErrorToast($translate('common.save_changes_failure'));
    }
  };
</script>

<!-- TODO: translate -->
<Modal width={25} bind:opened header="Encryption">
  {#if step === 1}
    <div class="flex-col gap-1">
      <div class="flex-col gap-0.5">
        <p>How does it works:</p>
        <ol>
          <li>RSA keys will be generated on client side.</li>
          <li>
            Encrypted by your password keys will stored on server so that you can access your data from another device.
          </li>
          <li>All data will be encrypted on client side and stored encrypted on server.</li>
          <li>Support team and developers can't access to your data because it will be encrypted.</li>
          <li>If you forgot password, it will be impossible to restore your data.</li>
        </ol>
      </div>
      <Button on:click={() => (step = 2)}>Continue</Button>
    </div>
  {:else if step === 2}
    <form on:submit|preventDefault={encryptKey} class="flex-col gap-1">
      <p>
        Private key will be encrypted by password and stored on the server so that you can access your data from another
        device.
      </p>
      <Input label="Password" bind:value={password} type="password" required minlength={6} autocomplete />
      <Input label="Repeat password" bind:value={repeatPassword} type="password" required minlength={6} autocomplete />
      {#if $loading}
        <Loader visible={$loading} />
      {:else}
        <Button type="submit">Continue</Button>
      {/if}
    </form>
  {/if}
</Modal>

<style>
  p {
    margin: 0;
    padding: 0;
  }
  ol {
    margin: 0;
    padding-left: 1em;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
</style>
