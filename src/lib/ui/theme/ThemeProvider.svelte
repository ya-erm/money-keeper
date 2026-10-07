<script lang="ts">
  import { onMount } from 'svelte';
  import { darkMode } from './theme';

  onMount(() => {
    return darkMode.subscribe((value) => {
      const themeColor = document.getElementById('app-theme-color');
      themeColor?.setAttribute('content', value ? '#121212' : '#ffffff');
      document.documentElement.dataset.startupTheme = value ? 'dark' : 'light';

      if (value) {
        window.document.body.classList.add('dark-mode');
      } else {
        window.document.body.classList.remove('dark-mode');
      }
    });
  });
</script>
