<script lang="ts">
  import ListSelectItem from './ListSelectItem.svelte';

  export let title: string;
  export let icon: string | null = null;
  export let href: string;
</script>

<ListSelectItem {icon} {title} value="" {href} />
