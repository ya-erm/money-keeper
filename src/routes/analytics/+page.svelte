<script lang="ts">
  import { goto } from '$app/navigation';
  import { route } from '$lib/routes';
  import { onMount } from 'svelte';

  onMount(() => goto(route('analytics.categories')));
</script>
