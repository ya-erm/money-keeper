<script lang="ts">
  import { api } from '$lib/api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Input from '$lib/Input.svelte';
  import { page } from '$app/stores';
  import Modal from '$lib/Modal.svelte';
  import type { GroupWithUsers } from '$lib/api/Api';
  import type { Writable } from 'svelte/store';

  export let opened: boolean;
  export let close: () => void;

  export let group: Writable<GroupWithUsers | null>;

  let name: string = $group?.name ?? '';

  const groupId = parseInt($page.params.id);

  const handleSubmit = async (e: SubmitEvent) => {
    const response = await api.groups.updateGroup(groupId, {
      name,
      users: $group?.users?.map((u) => u.phone) ?? [],
    });
    group.set(response.data);
    close();
  };
</script>

<Modal header="Edit name of group" bind:opened on:close={close}>
  <FormContainer submit={handleSubmit}>
    <Input label="Name" bind:value={name} required />
    <Button text="Save" type="submit" />
  </FormContainer>
</Modal>
