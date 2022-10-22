<script lang="ts">
  import type { Writable } from 'svelte/store';

  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import createBooleanStore from '$lib/utils/createBooleanStore';

  import AddUserToGroupModal from './AddUserToGroupModal.svelte';
  import type { GroupWithUsers } from './interface';

  export let group: Writable<GroupWithUsers>;
  const [opened, openModal, closeModal] = createBooleanStore();
</script>

<div>{$translate('groups.users')}:</div>
<ul class="users-list">
  {#each $group?.users ?? [] as user}
    <Button color="white" bordered>
      {user.name} ({user.login})
    </Button>
  {/each}
</ul>
<Button text={$translate('groups.add_user')} on:click={openModal} />
<AddUserToGroupModal {group} opened={$opened} {closeModal} />

<style>
  .users-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
