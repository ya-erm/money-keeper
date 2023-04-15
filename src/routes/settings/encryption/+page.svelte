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

  <div class="mt-2 flex-col gap-1">
    <h3>v2 links</h3>
    <a href="/v2/login">/v2/login</a>
    <a href="/v2/categories">/v2/categories</a>
    <a href="/v2/accounts/list">/v2/accounts/list</a>
    <a href="/v2/transactions">/v2/transactions</a>
  </div>
</div>
