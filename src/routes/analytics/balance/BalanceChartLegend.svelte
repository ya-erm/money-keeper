<script lang="ts">
  import type { Account } from '$lib/data/interfaces';

  export let accounts: Account[];
</script>

<div class="legend">
  {#each accounts as account}
    <div class="legend-item">
      <div class="color" style="background-color: {account.color}" />
      <span>{account.name}</span>
    </div>
  {/each}
</div>

<style>
  .legend {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .legend-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .color {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
  }
</style>
