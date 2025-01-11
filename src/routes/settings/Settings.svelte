<script lang="ts">
  import { version } from '$app/environment';
  import { goto } from '$app/navigation';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';

  import { membersService, selectedMemberStore, settingsService, memberSettingsStore } from '$lib/data';
  import { route, routes } from '$lib/routes';
  import { activeLocaleName, translate } from '$lib/translate';
  import LanguageModal from '$lib/translate/LanguageModal.svelte';
  import Loader from '$lib/ui/Loader.svelte';
  import Portal from '$lib/ui/Portal.svelte';
  import ListGroup from '$lib/ui/list/ListGroup.svelte';
  import ListLinkItem from '$lib/ui/list/ListLinkItem.svelte';
  import ListSelectItem from '$lib/ui/list/ListSelectItem.svelte';
  import ListSwitchItem from '$lib/ui/list/ListSwitchItem.svelte';
  import { darkMode } from '$lib/ui/theme';
  import createBooleanStore from '$lib/utils/createBooleanStore';

  import MainCurrencyModal from './currency-rates/MainCurrencyModal.svelte';

  // TODO: selectedMember is not a user, it can be a group
  const isGuest = membersService.isGuest;
  $: selectedMember = $selectedMemberStore;
  $: userIsLoggedIn = selectedMember && !isGuest;

  $: memberSettings = $memberSettingsStore;

  const [languageModalOpened, openLanguageModal] = createBooleanStore();
  const [currencyModalOpened, openCurrencyModal] = createBooleanStore();
  const [changeNameModalOpened, openChangeNameModal] = createBooleanStore();
  const [changeLoginModalOpened, openChangeLoginModal] = createBooleanStore();
  const [changePasswordModalOpened, openChangePasswordModal] = createBooleanStore();
  const [selectGroupModalOpened, openSelectGroupModal] = createBooleanStore();

  let showLogoutPortal = false;

  async function logout() {
    await settingsService.updateSettings({ selectedMember: null });
    if (selectedMember) {
      await membersService.deleteMember(selectedMember);
    }
    showLogoutPortal = true;
    window.location.assign(routes.login.path);
  }
</script>

<ListGroup title={$translate('settings.common')}>
  <ListSelectItem title={$translate('settings.language')} value={$activeLocaleName} onClick={openLanguageModal} />
  <ListSwitchItem title={$translate('settings.darkMode')} bind:checked={$darkMode} />
  <ListLinkItem title={$translate('currency_rates.title')} href={route('settings.currency_rates')} />
  <ListSelectItem
    title={$translate('currency_rates.default_currency')}
    value={memberSettings?.currency ?? ''}
    onClick={openCurrencyModal}
  />
</ListGroup>

<ListGroup title={$translate('settings.profile')}>
  {#if !userIsLoggedIn}
    <ListLinkItem title={$translate('auth.sign_in')} href={route('login')} />
  {:else}
    <ListSelectItem
      title={$translate('auth.login')}
      value={selectedMember?.login ?? undefined}
      onClick={openChangeLoginModal}
    />
  {/if}
  <ListLinkItem title={$translate('settings.import_export')} href={route('settings.import_export')} />
  <ListLinkItem title={$translate('settings.repeatings')} href={route('repeatings')} />
</ListGroup>

<ListGroup title={$translate('settings.debug_tools')}>
  <ListLinkItem title={$translate('settings.logs')} href={route('settings.logs')} />
  <ListLinkItem title={$translate('settings.report_problem')} href="https://github.com/ya-erm/money-keeper/issues" />
  <ListLinkItem title={'UI Kit'} href={route('uikit')} />
</ListGroup>

<div class="mt-1 flex-col items-center gap-0.5">
  {#if userIsLoggedIn}
    <Button
      color="danger"
      appearance="link"
      underlined={false}
      onClick={logout}
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
    <Button appearance="link" underlined={false} text="UI Kit" onClick={() => goto(routes.uikit.path)} />
  </div>
</div>

<LanguageModal bind:opened={$languageModalOpened} />
<MainCurrencyModal bind:opened={$currencyModalOpened} />

<Portal visible={showLogoutPortal}>
  <div class="logout-portal flex-col items-center justify-center h-full">
    <h3>{$translate('auth.logging_out')}</h3>
    <Loader visible={true} />
  </div>
</Portal>

<style>
  .build-info {
    font-size: 0.9em;
  }
  .logout-portal {
    background: var(--background-color);
  }
  .logout-portal > h3 {
    font-weight: normal;
  }
</style>
