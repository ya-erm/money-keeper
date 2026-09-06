<script lang="ts">
  import dayjs from 'dayjs';
  import { onMount } from 'svelte';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { showErrorToast, showSuccessToast } from '@ya-erm/svelte-ui/toasts';

  import { membersService } from '$lib/data';
  import { route } from '$lib/routes';
  import type {
    CreateTokenResponseData,
    ListTokensResponseData,
    RevokeTokenRequestData,
    RevokeTokenResponseData,
    TokenInfo,
  } from '$lib/server/api/v2/auth';
  import { translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';
  import ListGroup from '$lib/ui/list/ListGroup.svelte';
  import Loader from '$lib/ui/Loader.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { useFetch } from '$lib/utils';

  const isGuest = membersService.isGuest;

  const listFetcher = useFetch<undefined, ListTokensResponseData>('GET', '/api/v2/auth/tokens');
  const createFetcher = useFetch<undefined, CreateTokenResponseData>('POST', '/api/v2/auth/tokens');
  const revokeFetcher = useFetch<RevokeTokenRequestData, RevokeTokenResponseData>('DELETE', '/api/v2/auth/tokens');
  const creating = createFetcher.loading;
  const revoking = revokeFetcher.loading;

  let tokens: TokenInfo[] = [];
  let loaded = false;

  let newToken: string | null = null;
  let newTokenModalOpened = false;

  let revokingToken: TokenInfo | null = null;

  let origin = '';

  async function loadTokens() {
    try {
      const result = await listFetcher.fetch();
      tokens = result.tokens;
      loaded = true;
    } catch (e) {
      console.error(e);
      showErrorToast($translate('api_tokens.load_failure'));
    }
  }

  async function handleCreate() {
    try {
      const result = await createFetcher.fetch();
      newToken = result.token;
      newTokenModalOpened = true;
      await loadTokens();
    } catch (e) {
      console.error(e);
      showErrorToast($translate('api_tokens.create_failure'));
    }
  }

  async function handleRevoke() {
    if (!revokingToken) return;
    try {
      await revokeFetcher.fetch({ id: revokingToken.id });
      revokingToken = null;
      showSuccessToast($translate('api_tokens.revoke_success'));
      await loadTokens();
    } catch (e) {
      console.error(e);
      showErrorToast($translate('api_tokens.revoke_failure'));
    }
  }

  async function copyToken() {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      showSuccessToast($translate('api_tokens.copied'));
    } catch (e) {
      console.error(e);
      showErrorToast($translate('api_tokens.copy_failure'));
    }
  }

  onMount(() => {
    origin = window.location.origin;
    if (!isGuest) void loadTokens();
  });
</script>

<Layout title={$translate('api_tokens.title')} leftSlot={HeaderBackButton}>
  {#if isGuest}
    <div class="p-1">
      <p class="guest-hint">{$translate('api_tokens.guest_mode')}</p>
      <a class="flex-center" href={route('login')}>{$translate('auth.sign_in')}</a>
    </div>
  {:else}
    <ListGroup title={$translate('api_tokens.active_tokens')}>
      {#if !loaded}
        <li class="p-1 flex-center"><Loader visible={true} /></li>
      {:else if tokens.length === 0}
        <li class="p-1">{$translate('api_tokens.no_tokens')}</li>
      {:else}
        {#each tokens as token (token.id)}
          <li class="token flex items-center gap-1" data-testId="ApiTokenItem">
            <Icon name={token.current ? 'mdi:cellphone-link' : 'mdi:key-outline'} size={1.25} />
            <div class="flex-col flex-grow">
              <span class="token-id">{token.id}…</span>
              <span class="token-info">
                {$translate('api_tokens.created_at', { values: { date: dayjs(token.createdAt).format('DD.MM.YYYY') } })}
                {#if token.current}
                  · {$translate('api_tokens.current')}
                {/if}
              </span>
            </div>
            {#if !token.current}
              <Button
                appearance="link"
                color="danger"
                underlined={false}
                onClick={() => (revokingToken = token)}
                text={$translate('api_tokens.revoke')}
              />
            {/if}
          </li>
        {/each}
      {/if}
      <svelte:fragment slot="description">
        {$translate('api_tokens.description')}
      </svelte:fragment>
    </ListGroup>

    <div class="p-1">
      <Button class="w-full" onClick={handleCreate} disabled={$creating}>
        {$translate('api_tokens.create')}
      </Button>
    </div>

    <ListGroup title={$translate('api_tokens.usage')}>
      <li class="p-1 flex-col gap-0.5">
        <span class="usage-hint">{$translate('api_tokens.usage_hint')}</span>
        <code class="usage-example">curl -H "Authorization: Bearer &lt;token&gt;" {origin}/api/v2/snapshot</code>
      </li>
    </ListGroup>
  {/if}
</Layout>

<Modal bind:opened={newTokenModalOpened} header={$translate('api_tokens.new_token')} width={25}>
  <div class="flex-col gap-1">
    <p class="m-0">{$translate('api_tokens.new_token_hint')}</p>
    <code class="new-token" data-testId="NewApiToken">{newToken}</code>
    <Button onClick={copyToken}>{$translate('api_tokens.copy')}</Button>
    <Button color="white" bordered onClick={() => (newTokenModalOpened = false)}>{$translate('common.close')}</Button>
  </div>
</Modal>

<Modal
  opened={revokingToken !== null}
  header={$translate('api_tokens.revoke')}
  width={25}
  on:close={() => (revokingToken = null)}
>
  <div class="flex-col gap-1">
    <p class="m-0">{$translate('api_tokens.revoke_confirm', { values: { id: revokingToken?.id ?? '' } })}</p>
    <Button color="danger" onClick={handleRevoke} disabled={$revoking}>
      {$translate('api_tokens.revoke')}
    </Button>
    <Button color="white" bordered onClick={() => (revokingToken = null)}>{$translate('common.cancel')}</Button>
  </div>
</Modal>

<style>
  .token {
    padding: 0.5rem 10px;
  }
  .token-id {
    font-family: monospace;
  }
  .token-info {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  .guest-hint {
    text-align: center;
    color: var(--secondary-text-color);
  }
  .usage-hint {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
  .usage-example,
  .new-token {
    display: block;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: var(--background-color);
    border: 1px solid var(--border-color);
    font-size: 0.85rem;
    word-break: break-all;
    user-select: all;
  }
</style>
