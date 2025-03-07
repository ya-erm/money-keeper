<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';

  function reload() {
    location.reload();
  }
</script>

<Button appearance="transparent" onClick={reload}>
  <Icon name="material-symbols:refresh" />
</Button>
