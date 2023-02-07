<script lang="ts">
  import { routes } from '$lib/routes';
  import Icon from '$lib/ui/Icon.svelte';
</script>

<a href={routes['transactions.import.rules.create'].path}>
  <Icon name="mdi:plus" padding={1} />
</a>
