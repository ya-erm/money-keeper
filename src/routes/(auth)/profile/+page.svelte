<script lang="ts">
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="content">
  {#if data.user}
    <span>{$translate('auth.logged_in_as', { values: { name: data.user.name } })}</span>
    <a href={routes.logout.path}>{$translate('auth.sign_out')}</a>
  {:else}
    <span>{$translate('auth.not_logged_in')}</span>
    <a href={routes.login.path}>{$translate('auth.sign_in')}</a>
  {/if}
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
</style>
