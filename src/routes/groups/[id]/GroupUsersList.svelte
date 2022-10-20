<script lang="ts">
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import type { GroupWithUsers } from '$lib/api/Api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Input from '$lib/Input.svelte';
  import Modal from '$lib/Modal.svelte';
  import createBooleanStore from '$lib/utils/createBooleanStore';
  import type { Writable } from 'svelte/store';

  export let group: Writable<GroupWithUsers | null>;

  const groupId = parseInt($page.params.id);

  const [modalOpened, openModal, closeModal] = createBooleanStore();

  let user: string = '';

  const handleAddUser = async () => {
    try {
      const users = $group?.users?.map((u) => u.phone) ?? [];
      const resposnse = await api.groups.updateGroup(groupId, {
        name: $group!.name,
        users: [...users, user],
      });
      group.set(resposnse.data);
      closeModal();
    } catch {}
  };
</script>

<div>Users:</div>
<ul class="users-list">
  {#each $group?.users ?? [] as user}
    <Button color="white" bordered>
      {user.name} ({user.phone})
    </Button>
  {/each}
</ul>
<Button on:click={openModal}>Add user</Button>

<Modal header="Add user" bind:opened={$modalOpened} on:close={closeModal}>
  <FormContainer submit={handleAddUser}>
    <Input label="Phone or email" bind:value={user} required />
    <Button text="Add" type="submit" />
  </FormContainer>
</Modal>

<style>
  .users-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
