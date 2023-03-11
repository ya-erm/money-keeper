<script lang="ts">
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Tags from '$lib/ui/Tags.svelte';

  let tags = [
    { id: '1', title: 'Food' },
    { id: '2', title: 'Cash' },
    { id: '3', title: 'Money' },
    { id: '4', title: 'Car' },
    { id: '5', title: 'Income' },
  ];

  let selected: string[] = [];

  const onChange = (id: string, checked: boolean) => {
    selected = checked ? [...selected, id] : selected.filter((item) => item !== id);
  };

  let readOnly = false;

  const onAdd = (title: string) => {
    const id = title;
    tags = [...tags, { id, title }];
    selected = [...selected, id];
  };

  const onEdit = (id: string, title: string) => {
    tags = tags.map((tag) => (tag.id === id ? { id, title } : tag));
  };

  const onDelete = (id: string) => {
    tags = tags.filter((tag) => tag.id !== id);
  };
</script>

<h2>Tags</h2>
<div class="flex-col gap-1">
  <Checkbox bind:checked={readOnly} label="readOnly" />
  <Tags {tags} {selected} {onChange} {onAdd} {onEdit} {onDelete} {readOnly} />
</div>
