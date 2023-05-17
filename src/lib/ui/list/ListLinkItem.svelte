<script lang="ts">
  import ListSelectItem from './ListSelectItem.svelte';

  export let title: string;
  export let href: string;
</script>

<ListSelectItem {title} value="" {href} />
