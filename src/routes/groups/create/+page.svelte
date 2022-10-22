<script lang="ts">
  import { routes } from '$lib/routes';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import FormContainer from '$lib/ui/FormContainer.svelte';
  import { backLink } from '$lib/ui/header';
  import Input from '$lib/ui/Input.svelte';

  backLink.set(routes.groups.path);
</script>

<FormContainer action="?/create">
  <Input label={$translate('groups.name')} name="name" required />
  <Button text={$translate('common.create')} type="submit" />
</FormContainer>
