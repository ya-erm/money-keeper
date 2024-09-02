<script lang="ts">
  export let label: string | null = null;
  export let checked: boolean;
  export let onChange: ((value: boolean) => void) | null = null;
  export let disabled: boolean = false;
  export let indeterminate: boolean = false;
</script>

<label class="flex gap-0.5 items-center cursor-pointer">
  <input
    type="checkbox"
    bind:checked
    {indeterminate}
    {disabled}
    on:change={(e) => onChange?.(e.currentTarget.checked)}
  />
  {#if !!label}
    <span>{label}</span>
  {/if}
  <slot />
</label>
