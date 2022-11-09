<script lang="ts">
  import { translate } from '$lib/translate';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  export let name: string | null = null;
  export let label: string | null = null;
  export let type: 'text' | 'password' | 'date' | 'number' = 'text';
  export let placeholder: string | null = null;
  export let required: boolean = false;
  export let optional: boolean = false;
  export let autocomplete: boolean = false;
  export let minlength: number | null = null;
  export let maxlength: number | null = null;
  export let error: string | null = null;

  export let value: string | null = null;
  export let onChange: ((value: string) => void) | null = null;
  export let clearable = false;

  let input: HTMLInputElement;

  const handleChange = (e: Event) => {
    value = (e.target as HTMLInputElement).value;
    onChange?.(value);
  };

  const clearValue = () => {
    value = '';
    onChange?.('');
  };
</script>

<label class="input-label">
  {#if label}
    <span class="label-text" class:error={!!error}>
      <span>{label}</span>
      {#if optional}
        <span class="optional">({$translate('common.optional')})</span>
      {/if}
    </span>
  {/if}
  <div class="input-container flex-col">
    <input
      bind:this={input}
      on:input={handleChange}
      autocomplete={autocomplete ? 'on' : undefined}
      step={type === 'number' ? '0.01' : undefined}
      class:error={!!error}
      {placeholder}
      {minlength}
      {maxlength}
      {required}
      {value}
      {type}
      {name}
    />
    {#if clearable && !!value}
      <div class="clear-input flex-center" title={$translate('common.clear')}>
        <Button on:click={clearValue} appearance="link" color={error ? 'danger' : 'secondary'}>
          <Icon name="mdi:close" size={1.25} padding={0.5} />
        </Button>
      </div>
    {/if}
  </div>

  {#if error}
    <span class="error-text">{error}</span>
  {/if}
</label>

<style>
  .input-label {
    display: flex;
    flex-direction: column;
    position: relative;
    gap: 0.5rem;
  }
  .input-container {
    position: relative;
  }
  .label-text {
    font-size: 0.9rem;
  }
  .label-text.error {
    color: var(--red-color);
  }
  .optional {
    font-size: 0.9em;
    opacity: 0.5;
  }

  input {
    font-size: 1rem;
    border-radius: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    background-color: var(--header-background-color);
    color: var(--text-color);
    outline: none;
  }
  input:focus {
    border: 1px solid var(--active-color);
  }
  input.error {
    color: var(--red-color);
    border: 1px solid var(--red-color);
  }
  .clear-input {
    position: absolute;
    right: 0;
    bottom: 0;
    top: 0;
  }
  .error-text {
    font-size: 0.8rem;
    color: var(--red-color);
  }
</style>
