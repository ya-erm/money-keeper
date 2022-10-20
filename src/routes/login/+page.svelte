<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Input from '$lib/Input.svelte';
  import { routes } from '$lib/store/routes';
  import { token, userId } from '$lib/store/user';
  import { showApiErrorToast } from '$lib/utils/showApiErrorToast';

  let login = '';
  let password = '';

  const handleSubmit = async () => {
    try {
      const response = await api.auth.login({
        login,
        password,
      });
      if (response.data.user?.id) {
        userId.set(response.data.user.id);
        token.set((response.data as any).token);
        await goto(routes.groups.path);
      }
    } catch (e) {
      showApiErrorToast(e);
    }
  };
</script>

<FormContainer submit={handleSubmit}>
  <Input label="Login" bind:value={login} required />
  <Input label="Password" bind:value={password} type="password" required />
  <Button text="Log in" type="submit" />
  <a slot="footer" href="/register">Register</a>
</FormContainer>
