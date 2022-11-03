<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  $: type = $page.url.searchParams.get('type') ?? 'OUT';

  const handleClick = (value: string) => async () => {
    $page.url.searchParams.set('type', value);
    await goto($page.url);
    await invalidateAll();
  };
</script>

<div class="type-switch">
  <button on:click={handleClick('IN')} class="switch-item" class:active={type === 'IN'} type="button">Доход</button>
  <button on:click={handleClick('OUT')} class="switch-item" class:active={type === 'OUT'} type="button">Расход</button>
</div>

<style>
  .type-switch {
    display: flex;
    margin: 0 auto;
    border-radius: 1rem;
  }
  .switch-item {
    border: 0;
    outline: 0;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    background: var(--white-color);
    border: 1px solid var(--border-color);
  }
  .switch-item:hover {
    opacity: 0.9;
  }
  .switch-item:active {
    opacity: 0.8;
  }
  .switch-item:first-child {
    border-bottom-left-radius: 1rem;
    border-top-left-radius: 1rem;
  }
  .switch-item:last-child {
    border-bottom-right-radius: 1rem;
    border-top-right-radius: 1rem;
  }
  .active {
    color: var(--white-color);
    background-color: var(--active-color);
    border-color: var(--active-color);
  }
</style>
