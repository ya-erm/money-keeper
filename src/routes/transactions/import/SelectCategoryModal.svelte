<script lang="ts">
  import type { Category } from '@prisma/client';

  import Modal from '$lib/ui/Modal.svelte';

  import CategorySelect from '../CategorySelect.svelte';

  export let header: string;
  export let opened: boolean;

  export let type: 'IN' | 'OUT';
  export let categories: Category[];
  export let categoryId: number | null = null;
  export let onSave: ((id: number) => void) | null = null;

  const handleSelect = (id: number) => {
    onSave?.(id);
    opened = false;
  };
</script>

<Modal bind:opened {header}>
  <CategorySelect
    withoutHeader
    categories={categories.filter((category) => category.type === type)}
    onChange={handleSelect}
    {categoryId}
    {type}
  />
</Modal>
