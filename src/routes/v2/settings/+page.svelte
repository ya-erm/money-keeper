<script lang="ts">
  import { membersService } from '$lib/data';
  import { translate } from '$lib/translate';
  import { useTitle } from '$lib/ui/header';

  import Settings from './Settings.svelte';

  useTitle($translate('settings.title'));

  // TODO: selectedMember is not a user, it can be a group
  const selectedMember = membersService.$selectedMember;
  $: login = $selectedMember?.login;
  $: user = login ? { login } : null;
</script>

<Settings {user} />
