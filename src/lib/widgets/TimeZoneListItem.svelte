<script lang="ts">
  import ListGroupItem from '$lib/ui/list/ListGroupItem.svelte';
  import { toShortTimezoneOffset } from '$lib/utils';

  export let timezone: {
    tzCode: string;
    name: string;
    utc: string;
  };

  export let onClick: (timezone: string, shift: string) => void;
</script>

<ListGroupItem>
  <button
    class="item flex gap-1 items-center"
    on:click={() => onClick(timezone.tzCode, toShortTimezoneOffset(timezone.utc))}
  >
    <div class="flex-col gap-0.25 items-start flex-grow">
      <span class="name text-ellipsis">{timezone.tzCode}</span>
      <span class="description text-ellipsis">{timezone.name}</span>
    </div>
    <span class="utc">
      GMT{timezone.utc}
    </span>
  </button>
</ListGroupItem>

<style>
  button {
    width: 100%;
    border: none;
    outline: none;
    font-size: 1rem;
    background: transparent;
    align-self: stretch;
    cursor: pointer;
    padding: 0.5rem 1rem;
    color: var(--primary-text-color);
  }
  @media (hover: hover) {
    button:hover {
      background: var(--hover-background-color);
    }
  }
  .text-ellipsis {
    text-align: left;
    display: -webkit-box;
    word-break: break-all;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }
  .name {
    font-weight: 500;
  }
  .description {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
  .utc {
    text-wrap: nowrap;
  }
</style>
