<script lang="ts">
  import { translate } from '$lib/translate';
  import Icon from '$lib/ui/Icon.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { invalidateAll } from '$app/navigation';
  import { showErrorToast } from '$lib/ui/toasts';

  export let opened: boolean;
  export let userId: number | null;
  export let groupId: number | null;
  export let groups: Array<{ id: number; name: string }> = [];

  let selectedGroupId = groupId;

  const handleAccept = async () => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        groupId: selectedGroupId,
      }),
    });
    if (response.ok) {
      await invalidateAll();
      opened = false;
    } else {
      showErrorToast($translate('settings.profile.change_workspace_failure'));
    }
  };
</script>

<Modal header={$translate('settings.profile.change_workspace')} {opened} on:close={() => (opened = false)}>
  <ul class="flex-col">
    {#each groups as group (group.id)}
      <li
        class="flex items-center justify-between gap-0.5"
        class:active={selectedGroupId === group.id}
        on:click={() => (selectedGroupId = group.id)}
        aria-hidden
      >
        <span>{group.name}</span>
        {#if selectedGroupId === group.id}
          <Icon name="mdi:check" />
        {/if}
      </li>
    {/each}
  </ul>
  <div class="grid-col-2 gap-1">
    <Button text={$translate('common.cancel')} color="secondary" on:click={() => (opened = false)} />
    <Button text={$translate('common.accept')} color="primary" on:click={handleAccept} />
  </div>
</Modal>

<style>
  ul {
    padding: 0;
    min-width: 14rem;
  }
  li {
    padding: 0.5rem;
    min-height: 2.5rem;
  }
  li.active {
    color: var(--active-color);
  }
  @media (hover: hover) {
    li:hover {
      background: var(--hover-background-color);
    }
  }
</style>
