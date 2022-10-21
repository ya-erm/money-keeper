<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

{#if data.user}
  <div>
    Hello, {data.user.name}!
  </div>
{/if}
