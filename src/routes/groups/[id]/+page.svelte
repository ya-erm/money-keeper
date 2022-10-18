<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Input from '$lib/Input.svelte';
  import { routes } from '$lib/store/routes';
  import { writable } from 'svelte/store';
  import type { PageData } from './$types';

  export let data: PageData;

  console.log(data);

  const name = writable(data.name);

  const handleSubmit = async (e: SubmitEvent) => {
    const response = await api.groups.updateGroup(data.id, {
      name: $name,
      users: [], // TODO
    });
    if (response.ok) {
      goto(routes.groups.path);
    }
  };
</script>

<FormContainer submit={handleSubmit}>
  <Input label="Name" bind:value={$name} required />
  <Button text="Save" type="submit" />
</FormContainer>
