<script lang="ts">
  import { v4 as uuid } from 'uuid';

  import type { Tag } from '$lib/data/interfaces';
  import { tagsService } from '$lib/data/main';
  import { translate } from '$lib/translate';
  import Tags from '$lib/ui/Tags.svelte';
  import { showErrorToast } from '$lib/ui/toasts';

  export let tags: Tag[];
  export let selectedTags: string[] = [];

  const addTag = async (name: string) => {
    try {
      const tag = { id: uuid(), name };
      tagsService.save(tag);
      tags = [...tags, tag];
      selectedTags = [...selectedTags, `${tag.id}`];
    } catch {
      showErrorToast($translate('tags.add_tag_failure'));
    }
  };

  const editTag = async (id: string, name: string) => {
    try {
      const tag = { id, name };
      tagsService.save(tag);
      tags = tags.map((item) => (`${item.id}` === id ? tag : item));
    } catch {
      showErrorToast($translate('tags.edit_tag_failure'));
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const tag = tags.find((t) => t.id === id);
      if (!tag) return;
      tagsService.delete(tag);
      tags = tags.filter((item) => `${item.id}` !== id);
      selectedTags = selectedTags.filter((item) => item !== id);
    } catch {
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
