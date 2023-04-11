<script lang="ts">
  import mainService from '$lib/data/main';
  import { onMount } from 'svelte';

  onMount(async () => {
    await mainService.init();
  });
</script>

<slot />
