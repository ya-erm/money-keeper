<script lang="ts">
  import Icon from './Icon.svelte';

  type Option = { id: string; icon?: string; title: string };

  export let options: Option[];
  export let selected: Option | undefined;
  export let disabled: boolean = false;
  export let sameSize: boolean = false;
  export let testId: string | undefined = 'MultiSwitch';
  export let ariaLabel: string | null = null;

  export let onChange: ((value: Option) => void) | null = null;

  const handleClick = (value: Option) => async () => {
    if (disabled) return;
    selected = value;
    onChange?.(value);
  };
</script>

<div class="multi-switch" class:same-size={sameSize} data-testId={testId} role="group" aria-label={ariaLabel}>
  {#each options as option (option.id)}
    <button
      on:click={handleClick(option)}
      class:with-icon={Boolean(option.icon)}
      class:active={selected?.id === option.id}
      data-testId={`${testId}.Button.${option.id}`}
      class="switch-item text-ellipsis"
      type="button"
      {disabled}
    >
      {#if option.icon}
        <Icon name={option.icon} size={1.5} />
      {/if}
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
  .multi-switch.same-size {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
  }
  button {
    min-width: 0;
    font-size: 1rem;
    font-weight: normal;
    display: inline-flex;
    cursor: pointer;
    outline: none;
    border: none;

    color: inherit;
    background: none;

    padding: 0;
    margin: 0;
    overflow: hidden;
  }
  button:focus-visible {
    outline: 2px solid var(--active-color);
    z-index: 1;
  }
  .switch-item {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    color: var(--primary-text-color);
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
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
  .switch-item.with-icon {
    padding: 0.5rem;
  }
  .active {
    color: var(--white-color);
    background-color: var(--active-color);
    border-color: var(--active-color);
  }
</style>
