<script lang="ts">
  import { routes } from '$lib/routes';
  import Icon from '$lib/ui/Icon.svelte';
</script>

<a href={routes['accounts.create'].path}>
  <Icon name="mdi:credit-card-plus-outline" padding={1} />
</a>
