<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '$lib/ui/Icon.svelte';

  export let href: string;
  export let icon: string;
  export let label: string;

  const handleClick = () => {
    goto(href, { replaceState: true });
  };
</script>

<a title={label} aria-label={label} {href} on:click={handleClick}>
  <Icon name={icon} padding={1} />
</a>

<style>
  a {
    display: inline-block;
  }
</style>
