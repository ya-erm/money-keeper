<script lang="ts">
  import Menu from '$lib/ui/menu/Menu.svelte';
  import type { Component } from 'svelte';
  import Header from './Header.svelte';

  export let title: string;
  export let onBack: VoidFunction | null = null;
  export let leftSlot: Component | null = null;
  export let rightSlot: Component | null = null;

  export let hideMenu = false;
</script>

<main>
  <Header {title} {onBack} {leftSlot} {rightSlot} />
  <div class="page">
    <slot />
  </div>
  {#if !hideMenu}
    <Menu />
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    color: var(--primary-text-color);
    background-color: var(--background-color);
    padding: 0;
    height: 100vh;
    max-height: -webkit-fill-available;
  }

  .page {
    overflow-y: auto;
    flex-grow: 1;
  }
</style>
