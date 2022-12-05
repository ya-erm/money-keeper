<script lang="ts">
  import { enhance } from '$app/forms';
  import { writable } from 'svelte/store';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink, useTitle } from '$lib/ui/header';
  import Icon from '$lib/ui/Icon.svelte';

  import type { PageData } from './$types';
  import GroupNameModal from './EditGroupNameModal.svelte';
  import GroupUsersList from './GroupUsersList.svelte';
  import DeleteGroupModal from './DeleteGroupModal.svelte';

  export let data: PageData;

  useTitle($translate('groups.edit_group'));
  backLink.set(routes.groups.path);

  const group = writable(data.group);

  let groupNameModalOpened = false;
  let deleteGroupModalOpened = false;
</script>

{#if !!$group}
  <FormContainer>
    <div>
      <div>{$translate('groups.name')}:</div>
      <div class="editable-value">
        <span>{$group.name}</span>
        <Button on:click={() => (groupNameModalOpened = true)} appearance="transparent" color="white">
          <Icon name="mdi:pencil" />
        </Button>
      </div>
    </div>
    <GroupNameModal {group} bind:opened={groupNameModalOpened} />
    <GroupUsersList {group} />
    <Button
      slot="footer"
      type="button"
      text={$translate('groups.delete_group')}
      on:click={() => (deleteGroupModalOpened = true)}
      appearance="transparent"
      color="danger"
    />
  </FormContainer>
  <DeleteGroupModal groupId={$group.id} bind:opened={deleteGroupModalOpened} />
{/if}

<style>
  .editable-value {
    display: flex;
    align-items: center;
    justify-content: space-between;
    align-items: center;
    margin-left: 0.5rem;
    font-weight: 600;
    gap: 0.5rem;
  }
</style>
