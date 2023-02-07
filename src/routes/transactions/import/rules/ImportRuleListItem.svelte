<script lang="ts">
  import { routes } from '$lib/routes';
  import Icon from '$lib/ui/Icon.svelte';
  import ListGroupItem from '$lib/ui/list/ListGroupItem.svelte';

  export let rule: {
    id: number;
    text: string;
    category?: { icon?: string | null; name: string } | null;
    tags: { id: number; name: string }[];
  };
</script>

<a href={`${routes['transactions.import.rules'].path}/${rule.id}`} class="text-decoration-none">
  <ListGroupItem>
    <div class="flex-grow py-0.5 flex gap-0.5 items-center">
      <div class="icon flex-center">
        <Icon name={rule.category?.icon || 'mdi:folder-outline'} size={1.75} padding={0.75} />
      </div>
      <div class="flex-grow flex-col gap-0.25">
        <div>
          {rule.category?.name}
        </div>
        <div class="small-text">
          {rule.text}
        </div>
        <div class="tags">
          {rule.tags.map((t) => `#${t.name}`).join(' ')}
        </div>
      </div>
      <div>
        <Icon name="mdi:chevron-right" size={1.5} />
      </div>
    </div>
  </ListGroupItem>
</a>

<style>
  a {
    color: var(--primary-text-color);
  }
  .small-text {
    font-size: 0.9em;
  }
  .tags {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  .icon {
    border-radius: 100%;
    background: var(--header-background-color);
  }
</style>
