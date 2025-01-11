<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import GridCircleItem from '$lib/ui/GridCircleItem.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Input from '@ya-erm/svelte-ui/Input';
  import MultiSwitch from '$lib/ui/MultiSwitch.svelte';

  import { categoryIcons } from './icons';

  export let icon: string | null = null;
  export let onSelect: (icon: string | null) => void;

  const icons = Object.values(categoryIcons).flat();

  const tabs = [
    { id: 'recommended', title: $translate('icons.recommended') },
    { id: 'custom', title: $translate('icons.custom') },
  ];

  let selectedTab = !icon || icons.includes(icon) ? tabs[0] : tabs[1];
</script>

<div class="p-1 flex-col gap-1 items-center">
  <MultiSwitch options={tabs} selected={selectedTab} onChange={(value) => (selectedTab = value)} />
  {#if selectedTab.id === 'recommended'}
    <div class="w-full grid">
      {#each icons as item}
        <GridCircleItem icon={item} text="" onClick={() => onSelect(item)} selected={item === icon} />
      {/each}
    </div>
  {/if}
  {#if selectedTab.id === 'custom'}
    <div class="w-full flex-col gap-1">
      <div class="w-full flex gap-1 items-center">
        <Input name="icon" bind:value={icon} placeholder="mdi:folder-outline">
          <a slot="end" href="https://icon-sets.iconify.design/" target="_blank" rel="noopener noreferrer">
            <Icon name="mdi:open-in-new" padding={0.5} />
          </a>
        </Input>
        <div class="flex-col gap-0.5">
          <GridCircleItem icon={icon || 'mdi:folder-outline'} />
        </div>
      </div>
      <Button on:click={() => onSelect(icon)}>{$translate('common.continue')}</Button>
    </div>
  {/if}
</div>

<style>
  .grid {
    display: grid;
    justify-content: center;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    gap: 0.5rem;
  }
</style>
