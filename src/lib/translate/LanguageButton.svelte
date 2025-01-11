<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';

  import LanguageModal from './LanguageModal.svelte';

  let opened = false;
  const openModal = () => (opened = true);
</script>

<Button appearance="transparent" onClick={openModal}>
  <Icon name="mdi:translate" />
</Button>

<LanguageModal bind:opened />
