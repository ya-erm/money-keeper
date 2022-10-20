<script lang="ts">
  export let name: string | null = null;
  export let label: string | null = null;
  export let error: string | null = null;
  export let type: 'text' | 'password' = 'text';
  export let required: boolean = false;
  export let minlength: number | null = null;
  export let maxlength: number | null = null;

  let input: HTMLInputElement;

  export let value: string | null;
  export let placeholder: string | null = null;
  export function focus() {
    input.focus();
  }

  const handleChange = (e: Event) => {
    value = (e.target as HTMLInputElement).value;
  };
</script>

<label class="input-container">
  {#if label}
    <span class="label-text" class:error={!!error}>
      <span>{label}:</span>
    </span>
  {/if}
  <input
    bind:this={input}
    on:change={handleChange}
    class:error={!!error}
    {placeholder}
    {minlength}
    {maxlength}
    {required}
    {value}
    {type}
    {name}
  />
  {#if error}
    <span class="error-text">{error}</span>
  {/if}
</label>

<style>
  .input-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .label-text {
    font-size: 0.9rem;
  }
  .label-text.error {
    color: var(--red-color);
  }

  input {
    font-size: 1rem;
    border-radius: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    outline: none;
  }
  input:focus {
    border: 1px solid var(--active-text-color);
  }
  input.error {
    border: 1px solid var(--red-color);
  }
  .error-text {
    font-size: 0.8rem;
    color: var(--red-color);
  }
</style>
