<script lang="ts">
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

  const onAdd = (title: string) => {
    const id = title;
    tags = [...tags, { id, title }];
    selected = [...selected, id];
  };
</script>

<h2>Tags</h2>
<Tags {tags} {selected} {onChange} {onAdd} />
