<script lang="ts">
  import { version } from '$app/environment';
  import { goto } from '$app/navigation';
  import { membersService } from '$lib/data';

  import { route, routes } from '$lib/routes';
  import { activeLocaleName, translate } from '$lib/translate';
  import LanguageModal from '$lib/translate/LanguageModal.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import ListGroup from '$lib/ui/list/ListGroup.svelte';
  import ListLinkItem from '$lib/ui/list/ListLinkItem.svelte';
  import ListSelectItem from '$lib/ui/list/ListSelectItem.svelte';
  import ListSwitchItem from '$lib/ui/list/ListSwitchItem.svelte';
  import { darkMode } from '$lib/ui/theme';
  import createBooleanStore from '$lib/utils/createBooleanStore';

  // TODO: selectedMember is not a user, it can be a group
  const selectedMember = membersService.$selectedMember;
  $: login = $selectedMember?.login;

  const [languageModalOpened, openLanguageModal] = createBooleanStore();
  const [changeNameModalOpened, openChangeNameModal] = createBooleanStore();
  const [changeLoginModalOpened, openChangeLoginModal] = createBooleanStore();
  const [changePasswordModalOpened, openChangePasswordModal] = createBooleanStore();
  const [selectGroupModalOpened, openSelectGroupModal] = createBooleanStore();

  async function logout() {
    if ($selectedMember) {
      await membersService.deleteMember($selectedMember);
    }
    await goto(routes.login.path);
  }
</script>

<ListGroup title={$translate('settings.common')}>
  <ListSelectItem title={$translate('settings.language')} value={$activeLocaleName} on:click={openLanguageModal} />
  <ListSwitchItem title={$translate('settings.darkMode')} bind:checked={$darkMode} />
  <ListLinkItem title={$translate('currency_rates.title')} href={route('settings.currency_rates')} />
</ListGroup>

<ListGroup title={$translate('settings.profile')}>
  {#if !$selectedMember}
    <ListLinkItem title={$translate('auth.sign_in')} href={route('login')} />
  {:else}
    <ListSelectItem title={$translate('auth.login')} value={login ?? ''} on:click={openChangeLoginModal} />
  {/if}
  <ListLinkItem title={$translate('settings.import_export')} href={route('settings.import_export')} />
</ListGroup>

<div class="mt-1 flex-col items-center gap-0.5">
  {#if $selectedMember}
    <Button
      color="danger"
      appearance="link"
      underlined={false}
      on:click={logout}
      text={$translate('settings.profile.logout')}
    />
  {/if}
  <a class="text-decoration-none" href="https://github.com/ya-erm/money-keeper/issues" target="_blank" rel="noreferrer">
    <Button appearance="link" underlined={false}>
      <span>
        <span>{$translate('settings.report_problem')}</span>
        <Icon name="ri:external-link-line" size={1} />
      </span>
    </Button>
  </a>
  <div class="build-info">
    <span>{$translate('settings.version', { values: { version } })}</span>
    <span>•</span>
    <Button appearance="link" underlined={false} text="UI Kit" on:click={() => goto(routes.uikit.path)} />
  </div>
</div>

<LanguageModal bind:opened={$languageModalOpened} />

<style>
  .build-info {
    font-size: 0.9em;
  }
</style>
