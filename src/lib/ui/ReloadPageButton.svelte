<script lang="ts">
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  function reload() {
    location.reload();
  }
</script>

<Button appearance="transparent" on:click={reload}>
  <Icon name="material-symbols:refresh" />
</Button>
