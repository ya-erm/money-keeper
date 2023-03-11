<script lang="ts">
  import type { Tag } from '@prisma/client';

  import { translate } from '$lib/translate';
  import { showErrorToast } from '$lib/ui/toasts';
  import Tags from '$lib/ui/Tags.svelte';

  export let tags: Tag[];
  export let selectedTags: string[] = [];

  const addTag = async (name: string) => {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      const tag = (await response.json()) as Tag;
      tags = [...tags, tag];
      selectedTags = [...selectedTags, `${tag.id}`];
    } else {
      showErrorToast($translate('tags.add_tag_failure'));
    }
  };

  const editTag = async (id: string, name: string) => {
    const response = await fetch(`/api/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      const tag = (await response.json()) as Tag;
      tags = tags.map((item) => (`${item.id}` === id ? tag : item));
    } else {
      showErrorToast($translate('tags.edit_tag_failure'));
    }
  };

  const deleteTag = async (id: string) => {
    const response = await fetch(`/api/tags/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      tags = tags.filter((item) => `${item.id}` !== id);
      selectedTags = selectedTags.filter((item) => item !== id);
    } else {
      showErrorToast($translate('tags.delete_tag_failure'));
    }
  };

  const toggleTag = async (tagId: string, selected: boolean) => {
    selectedTags = selected ? [...selectedTags, tagId] : selectedTags.filter((t) => t !== tagId);
  };
</script>

<Tags
  tags={tags.map((tag) => ({ id: `${tag.id}`, title: tag.name }))}
  selected={selectedTags}
  onChange={toggleTag}
  onAdd={addTag}
  onEdit={editTag}
  onDelete={deleteTag}
/>
<input name="tags" class="hidden" multiple value={selectedTags} />
