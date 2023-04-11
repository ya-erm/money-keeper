<script>
  import ListSelectItem from '$lib/ui/list/ListSelectItem.svelte';
  import ListSwitchItem from '$lib/ui/list/ListSwitchItem.svelte';
  import EnableEncryptionModal from './EnableEncryptionModal.svelte';

  let opened = false;
</script>

<div class="p-1">
  <!-- TODO: translate text -->
  <ListSwitchItem title="Encryption" checked={false} />
  <ListSelectItem title="Public key" value="******" />
  <EnableEncryptionModal bind:opened />
</div>
