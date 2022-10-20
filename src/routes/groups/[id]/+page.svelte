<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import type { GroupWithUsers } from '$lib/api/Api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Icon from '$lib/Icon.svelte';
  import { backLink, title } from '$lib/store/navigation';
  import { routes } from '$lib/store/routes';
  import createBooleanStore from '$lib/utils/createBooleanStore';
  import { writable } from 'svelte/store';
  import GroupNameModal from './GroupNameModal.svelte';
  import GroupUsersList from './GroupUsersList.svelte';

  backLink.set(routes.groups.path);

  const groupId = parseInt($page.params.id);
  const group = writable<GroupWithUsers | null>(null);

  group.subscribe((g) => g && title.set(g?.name));

  (async () => {
    try {
      const { data } = await api.groups.getGroup(groupId);
      group.set(data);
    } catch {}
  })();

  const [modalOpened, openModal, closeModal] = createBooleanStore();

  const deleteGroup = async () => {
    await api.groups.deleteGroup(groupId);
    goto(routes.groups.path);
  };
</script>

{#if !!$group}
  <FormContainer submit={() => {}}>
    <div>
      <div>Name:</div>
      <div class="editable-value">
        <span>{$group.name}</span>
        <Button on:click={openModal} appearance="transparent" color="white">
          <Icon path="/icons/pencil.svg" size="1.25rem" />
        </Button>
      </div>
    </div>
    <GroupNameModal {group} bind:opened={$modalOpened} close={closeModal} />
    <GroupUsersList {group} />
    <Button text="Delete group" on:click={deleteGroup} appearance="transparent" color="danger" />
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
