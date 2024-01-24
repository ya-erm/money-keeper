<script lang="ts">
  import { translate } from '$lib/translate';

  export let text: string;
  export let optional: boolean = false;
  export let disabled: boolean = false;
  export let error: string | boolean | null = false;
  export let testId: string | null = 'InputLabel';
</script>

<span class="label-text" class:disabled class:error={!!error} data-testId={testId}>
  <span>{text}</span>
  {#if optional}
    <span class="optional">({$translate('common.optional')})</span>
  {/if}
</span>

<style>
  .label-text {
    font-size: 0.9rem;
  }
  .disabled {
    color: var(--secondary-text-color);
  }
  .error {
    color: var(--red-color);
  }
  .optional {
    font-size: 0.9em;
    opacity: 0.5;
  }
</style>
