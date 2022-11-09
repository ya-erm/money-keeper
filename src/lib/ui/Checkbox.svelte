<script lang="ts">
  export let label: string | null = null;
  export let checked: boolean;
</script>

<label class="flex gap-1 items-center cursor-pointer">
  <input type="checkbox" bind:checked />
  {#if !!label}
    <span>{label}</span>
  {/if}
</label>
