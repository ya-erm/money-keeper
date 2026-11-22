<script lang="ts">
  import { version } from '$app/env';
  import { goto } from '$app/navigation';

  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Portal from '@ya-erm/svelte-ui/Portal';

  import {
    membersService,
    selectedMemberStore,
    settingsService,
    settingsStore,
    memberSettingsStore,
  } from '#lib/data/index.js';
  import { route, routes } from '#lib/routes.js';
  import { activeLocaleName, translate } from '#lib/translate/index.js';
  import LanguageModal from '#lib/translate/LanguageModal.svelte';
  import Loader from '#lib/ui/Loader.svelte';
  import ListGroup from '#lib/ui/list/ListGroup.svelte';
  import ListLinkItem from '#lib/ui/list/ListLinkItem.svelte';
  import ListSelectItem from '#lib/ui/list/ListSelectItem.svelte';
  import ListSwitchItem from '#lib/ui/list/ListSwitchItem.svelte';
  import { darkMode } from '#lib/ui/theme/index.js';
  import createBooleanStore from '#lib/utils/createBooleanStore.js';

  import MainCurrencyModal from './currency-rates/MainCurrencyModal.svelte';

  // TODO: selectedMember is not a user, it can be a group
  const isGuest = membersService.isGuest;
  $: selectedMember = $selectedMemberStore;
  $: userIsLoggedIn = selectedMember && !isGuest;

  $: memberSettings = $memberSettingsStore;

  const [languageModalOpened, openLanguageModal] = createBooleanStore();
  const [currencyModalOpened, openCurrencyModal] = createBooleanStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [changeNameModalOpened, openChangeNameModal] = createBooleanStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [changeLoginModalOpened, openChangeLoginModal] = createBooleanStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [changePasswordModalOpened, openChangePasswordModal] = createBooleanStore();

  let showLogoutPortal = false;
  $: balancesHidden = $settingsStore.hideBalances ?? false;

  const handleHideBalancesChange = async (value: boolean) => {
    await settingsService.updateSettings({ hideBalances: value });
  };

  async function logout() {
    await settingsService.updateSettings({ selectedMember: null });
    if (selectedMember) {
      await membersService.deleteMember(selectedMember);
    }
    showLogoutPortal = true;
    window.location.assign(routes.login.path);
  }
</script>

<ListGroup title={$translate('settings.interface')}>
  <ListSelectItem
    icon="mdi:translate"
    title={$translate('settings.language')}
    value={$activeLocaleName}
    onClick={openLanguageModal}
  />
  <ListSwitchItem icon="mdi:theme-light-dark" title={$translate('settings.darkMode')} bind:checked={$darkMode} />
  <ListSwitchItem
    icon="mdi:eye-off-outline"
    title={$translate('settings.hideBalances')}
    bind:checked={balancesHidden}
    onChange={handleHideBalancesChange}
  />
</ListGroup>

<ListGroup title={$translate('settings.common')}>
  <ListLinkItem icon="mdi:shape-outline" title={$translate('categories.title')} href={route('categories')} />
  <ListLinkItem
    icon="mdi:currency-usd"
    title={$translate('currency_rates.title')}
    href={route('settings.currency_rates')}
  />
  <ListLinkItem
    icon="mdi:map-marker-outline"
    title={$translate('settings.known_places')}
    href={route('settings.known_places')}
  />
  <ListLinkItem icon="mdi:repeat" title={$translate('settings.repeatings')} href={route('repeatings')} />
</ListGroup>

<ListGroup title={$translate('settings.account')}>
  {#if !userIsLoggedIn}
    <ListLinkItem icon="mdi:login" title={$translate('auth.sign_in')} href={route('login')} />
  {:else}
    <ListSelectItem
      icon="mdi:account-outline"
      title={$translate('auth.login')}
      value={selectedMember?.login ?? undefined}
      onClick={openChangeLoginModal}
    />
  {/if}
  <ListLinkItem icon="ion:people" title={$translate('wallets.participants')} href={route('settings.participants')} />
  <ListLinkItem icon="mdi:wallet-outline" title={$translate('wallets.title')} href={route('settings.wallets')} />
  <ListSelectItem
    icon="mdi:cash-multiple"
    title={$translate('currency_rates.default_currency')}
    value={memberSettings?.currency ?? ''}
    onClick={openCurrencyModal}
  />
  <ListLinkItem
    icon="mdi:swap-vertical"
    title={$translate('settings.import_export')}
    href={route('settings.import_export')}
  />
</ListGroup>

{#if userIsLoggedIn}
  <ListGroup title={$translate('settings.integrations')}>
    <ListLinkItem
      icon="mdi:key-outline"
      title={$translate('settings.api_tokens')}
      href={route('settings.api_tokens')}
    />
  </ListGroup>
{/if}

<ListGroup title={$translate('settings.about')}>
  <ListLinkItem icon="mdi:history" title={$translate('settings.changelog')} href={route('settings.changelog')} />
  <ListLinkItem
    icon="mdi:bug-outline"
    title={$translate('settings.report_problem')}
    href="https://github.com/ya-erm/money-keeper/issues"
  />
</ListGroup>

<ListGroup title={$translate('settings.debug_tools')}>
  <ListLinkItem icon="mdi:text-box-search-outline" title={$translate('settings.logs')} href={route('settings.logs')} />
  <ListLinkItem icon="mdi:palette-outline" title="UI Kit" href={route('uikit')} />
</ListGroup>

<div class="mt-1 flex-col items-center gap-0.5">
  {#if userIsLoggedIn}
    <Button color="danger" appearance="link" underlined={false} onClick={logout}
      ><Icon name="mdi:logout" size={1.25} />{$translate('settings.profile.logout')}</Button
    >
  {/if}
  <a class="text-decoration-none" href="https://github.com/ya-erm/money-keeper/issues" target="_blank" rel="noreferrer">
    <Button appearance="link" underlined={false}>
      <span>
        <Icon name="mdi:bug-outline" size={1.25} />
        <span>{$translate('settings.report_problem')}</span>
        <Icon name="ri:external-link-line" size={1} />
      </span>
    </Button>
  </a>
  <div class="build-info">
    <span>{$translate('settings.version', { values: { version } })}</span>
    <span>•</span>
    <Button appearance="link" underlined={false} onClick={() => goto(routes.uikit.path)}
      ><Icon name="mdi:palette-outline" size={1.25} />UI Kit</Button
    >
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
