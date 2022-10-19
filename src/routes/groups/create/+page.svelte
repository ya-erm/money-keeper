<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Input from '$lib/Input.svelte';
  import { backLink } from '$lib/store/navigation';
  import { routes } from '$lib/store/routes';
  import { writable } from 'svelte/store';

  backLink.set(routes.groups.path);

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
