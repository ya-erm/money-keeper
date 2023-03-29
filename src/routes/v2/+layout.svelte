<script lang="ts">
  import { loadAll } from '$lib/data/initialization';
  import { onMount } from 'svelte';

  onMount(async () => {
    await loadAll();
  });
</script>

<slot />
