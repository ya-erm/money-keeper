<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Input from '$lib/Input.svelte';
  import { backLink, title } from '$lib/store/navigation';
  import { routes } from '$lib/store/routes';
  import { writable } from 'svelte/store';
  import Users from '../Users.svelte';

  backLink.set(routes.groups.path);

  const name = writable('');

  const groupId = parseInt($page.params.id);

  const fetchGroup = api.groups.getGroup(groupId).then((response) => {
    const group = response.data;
    title.set(group.name);
    name.set(group.name);
    return group;
  });

  const handleSubmit = async (e: SubmitEvent) => {
    const response = await api.groups.updateGroup(groupId, {
      name: $name,
      users: [], // TODO
    });
    if (response.ok) {
      goto(routes.groups.path);
    }
  };

  const deleteGroup = async () => {
    const response = await api.groups.deleteGroup(groupId);
    if (response.ok) {
      goto(routes.groups.path);
    }
  };
</script>

{#await fetchGroup then group}
  <FormContainer submit={handleSubmit}>
    <Input label="Name" bind:value={$name} required />

    <Users users={group.users ?? []} />

    <Button text="Save" type="submit" />
    <Button text="Delete" click={deleteGroup} appearance="transparent" color="danger" />
  </FormContainer>
{/await}
