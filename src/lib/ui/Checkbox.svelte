<script lang="ts">
  export let label: string | null = null;
  export let checked: boolean;
  export let disabled: boolean = false;
</script>

<label class="flex gap-0.5 items-center cursor-pointer">
  <input type="checkbox" bind:checked {disabled} />
  {#if !!label}
    <span>{label}</span>
  {/if}
</label>
