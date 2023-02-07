<script lang="ts">
  import { routes } from '$lib/routes';
  import Icon from '$lib/ui/Icon.svelte';
</script>

<a href={routes['transactions.import.rules'].path}>
  <Icon name="ion:options-outline" padding={1} />
</a>
