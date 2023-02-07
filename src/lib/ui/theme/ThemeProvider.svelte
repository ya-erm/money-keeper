<script lang="ts">
  import { onMount } from 'svelte';
  import { darkMode } from './theme';

  onMount(() => {
    darkMode.subscribe((value) => {
      if (value) {
        window.document.body.classList.add('dark-mode');
      } else {
        window.document.body.classList.remove('dark-mode');
      }
    });
  });
</script>

<svelte:head>
  <meta name="theme-color" content={$darkMode ? '#121212' : 'white'} />
</svelte:head>
