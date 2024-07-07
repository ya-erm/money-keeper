<script lang="ts">
  import { translate } from '$lib/translate';

  export let text: string;
  export let optional: boolean = false;
  export let disabled: boolean = false;
  export let error: string | boolean | null = false;
  export let testId: string | null = 'InputLabel';

  export let v2 = false;
  export let value: string | null | undefined = undefined;

  $: asPlaceholder = v2 && !value;
  $: asLabel = v2 && !asPlaceholder;
</script>

<span
  class="label-text"
  class:v2
  class:disabled
  class:error={!!error}
  class:as-label={asLabel}
  class:as-placeholder={asPlaceholder}
  data-testId={testId}
>
  <span class="text">{text}</span>
  {#if optional}
    <span class="optional">({$translate('common.optional')})</span>
  {/if}
</span>

<style>
  .label-text {
    font-size: 0.9rem;
  }
  .v2 {
    position: absolute;
    z-index: 1;
    color: var(--secondary-text-color);
    transition: all 0.2s;
  }
  .as-placeholder {
    padding: 0.75rem;
    top: 0;
    left: 0;
  }
  .as-label {
    top: -0.5rem;
    left: 0.75rem;
    font-size: 0.85rem;
    padding: 0;
  }
  .as-label::before {
    content: '';
    position: absolute;
    top: 0.5rem;
    height: 1px;
    width: calc(100% + 4px);
    margin-left: -2px;
    background: var(--header-background-color);
  }
  .disabled {
    color: var(--secondary-text-color);
  }
  .error {
    color: var(--red-color);
  }
  .text {
    position: relative;
  }
  .optional {
    position: relative;
    font-size: 0.9em;
    opacity: 0.5;
  }
</style>
