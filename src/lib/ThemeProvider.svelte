<script lang="ts">
  import { onMount } from 'svelte';
  import { darkMode } from './store/theme';

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

<style>
  :global(body) {
    --primary-text-color: black;
    --secondary-text-color: #7f7f7f;
    --active-text-color: #2f95dc;

    --background-color: #f2f2f2;
    --header-background-color: white;

    --red-color: #dc3545;
    --green-color: #28a745;
    --white-color: white;
    --active-color: #2f95dc;

    --hover-background-color: #eff4f9;

    --border-color: #d8d8d8;
  }

  :global(body.dark-mode) {
    --primary-text-color: white;
    --secondary-text-color: #7f7f7f;
    --active-text-color: white;

    --background-color: black;
    --header-background-color: #121212;

    --red-color: #dc3545;
    --green-color: #28a745;
    --white-color: white;
    --active-color: #2f95dc;

    --hover-background-color: #1b1b1c;

    --border-color: #272729;
  }

  :global(a) {
    color: var(--active-color);
  }
</style>
