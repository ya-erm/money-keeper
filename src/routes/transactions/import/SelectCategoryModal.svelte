<script lang="ts">
  import type { Category } from '@prisma/client';

  import { translate } from '$lib/translate';
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Modal from '$lib/ui/Modal.svelte';

  import CategorySelect from '../CategorySelect.svelte';

  export let header: string;
  export let opened: boolean;
  export let canCreateRule = false;

  export let type: 'IN' | 'OUT';
  export let categories: Category[];
  export let categoryId: number | null = null;
  export let onSave: ((id: number, createRule: boolean) => void) | null = null;

  let createRule = true;

  const handleSelect = (id: number) => {
    onSave?.(id, createRule);
    opened = false;
  };
</script>

<Modal bind:opened {header}>
  {#if canCreateRule}
    <div class="mb-1">
      <Checkbox bind:checked={createRule} label={$translate('transactions.import.rules.create')} />
    </div>
  {/if}
  <CategorySelect
    withoutHeader
    categories={categories.filter((category) => category.type === type)}
    onChange={handleSelect}
    {categoryId}
    {type}
  />
</Modal>
