<script lang="ts">
  import { translate } from '$lib/translate';
  import resizeObserver from '$lib/utils/resizeObserver';

  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import InputLabel from './InputLabel.svelte';

  export let name: string | null = null;
  export let label: string | null = null;
  export let type: 'text' | 'password' | 'date' | 'time' | 'number' | 'color' = 'text';
  export let inputmode: 'text' | 'search' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | null = null;
  export let placeholder: string | null = null;
  export let step: string | number | null = 0.01;
  export let required: boolean = false;
  export let optional: boolean = false;
  export let disabled: boolean = false;
  export let autocomplete: boolean = false;
  export let minlength: number | null = null;
  export let maxlength: number | null = null;
  export let error: string | null = null;
  export let list: string | null = null;
  export let testId: string | null = 'Input';

  export let value: string | null = null;
  export let onChange: ((value: string) => void) | null = null;

  export let align: 'left' | 'center' | 'right' = 'left';
  export let icon: string | null = null;
  export let endText: string | null = null;
  export let clearable = false;

  export let v2 = false;

  export let ref: HTMLInputElement | null = null;

  let startSlot: HTMLElement | null = null;
  let endSlot: HTMLElement | null = null;

  const onStartSlotResize = () => {
    const startSlotWidth = startSlot?.getBoundingClientRect().width ?? 0;
    ref?.style.setProperty('padding-left', startSlotWidth ? `${startSlotWidth}px` : '0.75rem');
  };

  const onEndSlotResize = () => {
    const endSlotWidth = endSlot?.getBoundingClientRect().width ?? 0;
    ref?.style.setProperty('padding-right', endSlotWidth ? `${endSlotWidth}px` : '0.75rem');
  };

  const handleChange = (e: Event) => {
    value = (e.target as HTMLInputElement).value;
    onChange?.(value);
  };

  const clearValue = () => {
    value = '';
    onChange?.('');
  };
</script>

<label class="input-label" data-testId={`${testId}.Container`}>
  {#if label}
    <InputLabel text={label} {optional} {disabled} {error} testId={`${testId}.Label`} {v2} {value} />
  {/if}
  <div class="input-container flex-col">
    <div
      class="start-slot flex items-center"
      bind:this={startSlot}
      use:resizeObserver={{ onResize: onStartSlotResize }}
    >
      <slot name="start" />
      {#if icon}
        <div class="start-icon" class:error={!!error}>
          <Icon name={icon} />
        </div>
      {/if}
    </div>
    <input
      bind:this={ref}
      on:input={handleChange}
      autocomplete={autocomplete ? 'on' : undefined}
      step={type === 'number' ? step : undefined}
      type={type === 'color' ? 'text' : type}
      data-testId={testId}
      class:error={!!error}
      class:withIcon={icon}
      class:align-center={align === 'center'}
      class:align-right={align === 'right'}
      class:clearable
      {placeholder}
      {minlength}
      {maxlength}
      {inputmode}
      {required}
      {disabled}
      {value}
      {list}
      {name}
      {...$$restProps}
    />
    <div class="end-slot flex items-center" bind:this={endSlot} use:resizeObserver={{ onResize: onEndSlotResize }}>
      {#if type === 'color'}
        <input class="input-color" type="color" bind:value {disabled} />
      {/if}
      {#if endText}
        <span class="end-text" class:mr-1={!clearable || !value} data-testId={`${testId}.EndText`}>
          {endText}
        </span>
      {/if}
      <slot name="end" />
      {#if clearable && !!value}
        <div class="flex-center" title={$translate('common.clear')}>
          <Button
            on:click={clearValue}
            appearance="link"
            color={error ? 'danger' : 'secondary'}
            aria-label={$translate('common.clear')}
            testId={`${testId}.ClearButton`}
            {disabled}
          >
            <Icon name="mdi:close" size={1.25} padding={0.5} />
          </Button>
        </div>
      {/if}
    </div>
  </div>

  {#if error}
    <span class="error-text" data-testId={`${testId}.Error`}>{error}</span>
  {/if}
</label>

<style>
  .input-label {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    gap: 0.5rem;
  }
  .input-container {
    position: relative;
  }
  .input-color {
    border: none;
    outline: none;
    background: transparent;
    padding: 0;
    margin: 0;
    margin-right: 0.5rem;
  }
  input {
    font-size: 1rem;
    border-radius: 0.75rem;
    padding: 0.75rem;
    min-height: 2.5rem;
    border: 1px solid var(--border-color);
    background-color: var(--header-background-color);
    color: var(--text-color);
    outline: none;
  }
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type='date'],
  input[type='time'] {
    -webkit-appearance: none;
  }
  input.withIcon {
    padding-left: 36px;
  }
  input:focus {
    border: 1px solid var(--active-color);
  }
  input:focus-visible {
    outline: 1px solid var(--active-color);
  }
  input.error {
    color: var(--red-color);
    border: 1px solid var(--red-color);
  }
  input.clearable {
    padding-right: 1.75rem;
  }
  input:disabled {
    color: var(--secondary-text-color);
  }
  :global(body.dark-mode input) {
    color-scheme: dark;
  }
  .start-slot {
    position: absolute;
    left: 0;
    bottom: 0;
    top: 0;
  }
  .start-icon {
    padding: 0.5rem;
    padding-right: 0.25rem;
    color: var(--secondary-text-color);
  }
  .start-icon.error {
    color: var(--red-color);
  }
  .end-slot {
    position: absolute;
    right: 0;
    bottom: 0;
    top: 0;
  }
  .end-text {
    color: var(--secondary-text-color);
  }
  .error-text {
    font-size: 0.8rem;
    color: var(--red-color);
  }

  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }
</style>
