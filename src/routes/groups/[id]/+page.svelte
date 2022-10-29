<script lang="ts">
  import { enhance } from '$app/forms';
  import { writable } from 'svelte/store';

  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink, title } from '$lib/ui/header';
  import Icon from '$lib/ui/Icon.svelte';
  import createBooleanStore from '$lib/utils/createBooleanStore';

  import type { PageData } from './$types';
  import GroupNameModal from './EditGroupNameModal.svelte';
  import GroupUsersList from './GroupUsersList.svelte';

  export let data: PageData;

  title.set($translate('groups.edit_group'));
  backLink.set(routes.groups.path);

  const group = writable(data.group);

  const [modalOpened, openModal, closeModal] = createBooleanStore();
</script>

{#if !!$group}
  <FormContainer>
    <div>
      <div>{$translate('groups.name')}:</div>
      <div class="editable-value">
        <span>{$group.name}</span>
        <Button on:click={openModal} appearance="transparent" color="white">
          <Icon name="mdi:pencil" />
        </Button>
      </div>
    </div>
    <GroupNameModal {group} bind:opened={$modalOpened} close={closeModal} />
    <GroupUsersList {group} />
    <form action="?/deleteGroup" method="POST" use:enhance class="flex-col items-center">
      <Button text={$translate('groups.delete_group')} type="submit" appearance="transparent" color="danger" />
    </form>
  </FormContainer>
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
