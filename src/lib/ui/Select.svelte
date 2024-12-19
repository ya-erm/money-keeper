<script lang="ts">
  type Option = { id: string; title: string };

  export let options: Option[];
  export let selected: string | undefined = undefined;
  export let onChange: ((id: string) => void) | undefined = undefined;

  export let align: 'left' | 'center' | 'right' = 'left';
</script>

<select
  on:change={(e) => {
    selected = e.currentTarget.value;
    onChange?.(selected);
  }}
  class:align-center={align === 'center'}
  class:align-right={align === 'right'}
>
  {#each options as option (option.id)}
    <option value={option.id} selected={option.id === selected}>
      {option.title}
    </option>
  {/each}
</select>

<style>
  select {
    font-size: 1rem;
    border-radius: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    background-color: var(--header-background-color);
    color: var(--text-color);
    outline: none;
  }
  select:focus {
    border: 1px solid var(--active-color);
  }
  select:focus-visible {
    outline: 1px solid var(--active-color);
  }
  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }
</style>
