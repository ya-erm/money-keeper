<script lang="ts">
  export let options: { id: string; title: string }[];
  export let selected: { id: string; title: string } | undefined;
  export let disabled: boolean = false;
  export let testId: string | undefined = 'MultiSwitch';

  export let onChange: (value: { id: string; title: string }) => void;

  const handleClick = (value: { id: string; title: string }) => async () => {
    if (disabled) return;
    selected = value;
    onChange(value);
  };
</script>

<div class="multi-switch" data-testId={testId}>
  {#each options as option (option.id)}
    <button
      on:click={handleClick(option)}
      class:active={selected?.id === option.id}
      data-testId={`${testId}.Button.${option.id}`}
      class="switch-item text-ellipsis"
      type="button"
      {disabled}
    >
      {option.title}
    </button>
  {/each}
</div>

<style>
  .multi-switch {
    display: flex;
    margin: 0 auto;
    border-radius: 1rem;
    max-width: 100%;
  }
  .switch-item {
    border: 0;
    margin: 0;
    outline: 0;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    color: var(--primary-text-color);
    background: var(--header-background-color);
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
  .switch-item:not(:last-child) {
    border-right: none;
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
