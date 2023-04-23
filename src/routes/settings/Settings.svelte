<script lang="ts">
  import { goto } from '$app/navigation';

  import { routes } from '$lib/routes';
  import { activeLocaleName, translate } from '$lib/translate';
  import LanguageModal from '$lib/translate/LanguageModal.svelte';
  import Button from '$lib/ui/Button.svelte';
  import ListGroup from '$lib/ui/list/ListGroup.svelte';
  import ListSelectItem from '$lib/ui/list/ListSelectItem.svelte';
  import ListSwitchItem from '$lib/ui/list/ListSwitchItem.svelte';
  import { darkMode } from '$lib/ui/theme';
  import createBooleanStore from '$lib/utils/createBooleanStore';
  import Icon from '$lib/ui/Icon.svelte';

  import ChangeNameModal from './ChangeNameModal.svelte';
  import ChangeLoginModal from './ChangeLoginModal.svelte';
  import ChangePasswordModal from './ChangePasswordModal.svelte';
  import SelectGroupModal from './SelectGroupModal.svelte';

  export let userId: number | null;
  export let user: { name?: string | null; login?: string | null } | null;
  export let groupId: number | null;
  export let group: { id: number; name: string } | null;
  export let groups: { id: number; name: string }[];
  export let version: string;

  const [languageModalOpened, openLanguageModal] = createBooleanStore();
  const [changeNameModalOpened, openChangeNameModal] = createBooleanStore();
  const [changeLoginModalOpened, openChangeLoginModal] = createBooleanStore();
  const [changePasswordModalOpened, openChangePasswordModal] = createBooleanStore();
  const [selectGroupModalOpened, openSelectGroupModal] = createBooleanStore();
</script>

<ListGroup title={$translate('settings.common')}>
  <ListSelectItem title={$translate('settings.language')} value={$activeLocaleName} on:click={openLanguageModal} />
  <ListSwitchItem title={$translate('settings.darkMode')} bind:checked={$darkMode} />
  <ListSelectItem
    title={$translate('currency_rates.title')}
    value=""
    on:click={() => goto(routes['settings.currency_rates'].path)}
  />
</ListGroup>

<ListGroup title={$translate('settings.profile')}>
  <ListSelectItem title={$translate('auth.name')} value={user?.name ?? ''} on:click={openChangeNameModal} />
  <ListSelectItem title={$translate('auth.login')} value={user?.login ?? ''} on:click={openChangeLoginModal} />
  <ListSelectItem title={$translate('auth.password')} value="******" on:click={openChangePasswordModal} />
  <ListSelectItem
    title={$translate('settings.encryption')}
    value=""
    on:click={() => goto(routes['settings.encryption'].path)}
  />
  <ListSelectItem
    title={$translate('settings.collaboration.workspace')}
    value={group?.name ?? ''}
    on:click={openSelectGroupModal}
  />
</ListGroup>

<ListGroup title={$translate('settings.collaboration')}>
  <ListSelectItem
    title={$translate('settings.collaboration.workspaces')}
    value=""
    on:click={() => goto(routes.groups.path)}
  />
  <ListSelectItem title={$translate('settings.collaboration.invites')} value="" disabled />
  <ListSelectItem title={$translate('settings.collaboration.blocklist')} value="" disabled />
</ListGroup>

<div class="mt-1 flex-col items-center gap-0.5 ">
  <a class="text-decoration-none" href={routes.logout.path}>
    <Button color="danger" appearance="link" underlined={false} text={$translate('settings.profile.logout')} />
  </a>
  <a class="text-decoration-none" href="https://github.com/ya-erm/money-keeper/issues" target="_blank" rel="noreferrer">
    <Button appearance="link" underlined={false}>
      <span>
        <span>{$translate('settings.report_problem')}</span>
        <Icon name="ri:external-link-line" size={1} />
      </span>
    </Button>
  </a>
  <div class="build-info ">
    <span>{$translate('settings.version', { values: { version } })}</span>
    <span>•</span>
    <Button appearance="link" underlined={false} text="UI Kit" on:click={() => goto(routes.uikit.path)} />
  </div>
</div>

<LanguageModal bind:opened={$languageModalOpened} />
<ChangeNameModal bind:opened={$changeNameModalOpened} {userId} value={user?.name} />
<ChangeLoginModal bind:opened={$changeLoginModalOpened} {userId} value={user?.login} />
<ChangePasswordModal bind:opened={$changePasswordModalOpened} {userId} />
<SelectGroupModal bind:opened={$selectGroupModalOpened} {userId} {groupId} {groups} />

<style>
  .build-info {
    font-size: 0.9em;
  }
</style>
