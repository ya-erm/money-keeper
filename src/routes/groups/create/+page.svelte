<script lang="ts">
  import { api } from '$lib/api';
  import FormContainer from '$lib/FormContainer.svelte';
  import Button from '$lib/Button.svelte';
  import Input from '$lib/Input.svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { routes } from '$lib/store/routes';

  const name = writable('');

  const handleSubmit = async (e: SubmitEvent) => {
    const response = await api.groups.createGroup({
      name: $name,
    });
    if (response.ok) {
      goto(routes.groups.path);
    }
  };
</script>

<FormContainer submit={handleSubmit}>
  <Input label="Name" bind:value={$name} required />
  <Button text="Create" type="submit" />
</FormContainer>
