<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Input from '$lib/Input.svelte';
  import { routes } from '$lib/store/routes';
  import { token, userId } from '$lib/store/user';
  import { writable } from 'svelte/store';

  const login = writable('Alex@bob.com');
  const password = writable('qwe123');

  const handleSubmit = async () => {
    const response = await api.auth.login({
      login: $login,
      password: $password,
    });
    if (response.data.user?.id) {
      userId.set(response.data.user.id);
      token.set((response.data as any).token);
      await goto(routes.groups.path);
    }
  };
</script>

<FormContainer submit={handleSubmit}>
  <Input label="Login" bind:value={$login} required />
  <Input label="Password" bind:value={$password} type="password" required />
  <Button text="Log in" type="submit" />
  <a slot="footer" href="/register">Register</a>
</FormContainer>
