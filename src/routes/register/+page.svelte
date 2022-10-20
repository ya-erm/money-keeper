<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import Button from '$lib/Button.svelte';
  import FormContainer from '$lib/FormContainer.svelte';
  import Input from '$lib/Input.svelte';
  import { routes } from '$lib/store/routes';
  import { showErrorToast, showToast } from '$lib/toasts';
  import { showApiErrorToast } from '$lib/utils/showApiErrorToast';

  let name = '';
  let email = '';
  let phone = '';
  let password = '';
  let repeatPassword = '';

  const handleSubmit = async (e: SubmitEvent) => {
    if (password !== repeatPassword) {
      return showErrorToast('Passwords must be same');
    }
    try {
      await api.auth.register({
        name,
        phone,
        password,
        email,
      });
      showToast({
        type: 'success',
        message: 'You are successfully registered',
      });
      goto(routes.login.path);
    } catch (e) {
      showApiErrorToast(e);
    }
  };
</script>

<FormContainer submit={handleSubmit}>
  <Input label="Name" bind:value={name} required />
  <Input label="Phone" bind:value={phone} required />
  <Input label="Password" bind:value={password} type="password" minlength={6} required />
  <Input label="Repeat password" bind:value={repeatPassword} type="password" minlength={6} required />
  <Button text="Register" type="submit" />
  <a slot="footer" href="/login">Login</a>
</FormContainer>
