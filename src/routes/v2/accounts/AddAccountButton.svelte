<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '$lib/ui/Icon.svelte';
</script>

<a href="?action=create" on:click={() => goto('?action=create', { replaceState: true })}>
  <Icon name="mdi:plus" padding={1} />
</a>
