<script lang="ts">
  import { page } from '#lib/page.js';
  import WalletEditor from '#lib/wallets/WalletEditor.svelte';
</script>

{#key $page.url.searchParams.get('id')}<WalletEditor id={$page.url.searchParams.get('id')} />{/key}
