<script>
  import { api } from '$lib/api';
  import FormContainer from '$lib/FormContainer.svelte';
  import Button from '$lib/Button.svelte';
  import Input from '$lib/Input.svelte';
  import { writable } from 'svelte/store';

  const name = writable('');
  const email = writable('');
  const phone = writable('');
  const password = writable('');

  const handleSubmit = async () => {
    const response = await api.auth.register({
      name: $name,
      phone: $phone,
      password: $password,
      email: $email,
    });
    alert(JSON.stringify(response.data));
  };
</script>

<FormContainer submit={handleSubmit}>
  <Input label="Name" bind:value={$name} />
  <Input label="Phone" bind:value={$phone} required />
  <Input label="Password" bind:value={$password} type="password" required />
  <Button text="Register" type="submit" />
  <a slot="footer" href="/login">Login</a>
</FormContainer>
