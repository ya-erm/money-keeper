<script lang="ts">
  import type { Writable } from 'svelte/store';

  import type { GroupWithUsers } from '$lib/interfaces';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';

  import AddUserToGroupModal from './AddUserToGroupModal.svelte';

  export let group: Writable<GroupWithUsers>;

  let addUserModalOpened = false;
</script>

<div>{$translate('groups.users')}:</div>
<ul class="users-list">
  {#each $group?.users ?? [] as user}
    <Button color="white" bordered>
      {user.name} ({user.login})
    </Button>
  {/each}
</ul>
<Button text={$translate('groups.add_user')} on:click={() => (addUserModalOpened = true)} />
<AddUserToGroupModal {group} bind:opened={addUserModalOpened} />

<style>
  .users-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
