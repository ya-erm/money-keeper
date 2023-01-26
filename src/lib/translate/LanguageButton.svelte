<script lang="ts">
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';

  import LanguageModal from './LanguageModal.svelte';

  let opened = false;
  const openModal = () => (opened = true);
</script>

<Button appearance="transparent" on:click={openModal}>
  <Icon name="mdi:translate" />
</Button>

<LanguageModal bind:opened />
