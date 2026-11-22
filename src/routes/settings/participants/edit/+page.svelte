<script lang="ts">
  import { page } from '#lib/page.js';
  import ParticipantEditor from '#lib/wallets/ParticipantEditor.svelte';
</script>

{#key $page.url.searchParams.get('id')}<ParticipantEditor id={$page.url.searchParams.get('id')} />{/key}
