<script lang="ts">
  import dayjs from 'dayjs';

  import { repeatingsStore } from '$lib/data';
  import { translate } from '$lib/translate';

  import RepeatingsList from './RepeatingsList.svelte';

  $: repeatings = $repeatingsStore;
  $: activeRepeatings = repeatings.filter((item) => !item.endDate || dayjs(item.endDate).isAfter(dayjs()));
  $: inactiveRepeatings = repeatings.filter((item) => dayjs(item.endDate).isBefore(dayjs()));
</script>

{#if !repeatings.length}
  <div class="p-1 w-full no-data">{$translate('repeatings.no_data')}</div>
{/if}

{#if activeRepeatings.length}
  <section class="p-1 flex-col gap-1">
    <h3 class="title">{$translate('repeatings.active')}</h3>
    <RepeatingsList repeatings={activeRepeatings} />
  </section>
{/if}

{#if inactiveRepeatings.length}
  <section class="p-1 flex-col gap-1">
    <h3 class="title">{$translate('repeatings.inactive')}</h3>
    <RepeatingsList repeatings={inactiveRepeatings} />
  </section>
{/if}

<style>
  .no-data {
    text-align: center;
    color: var(--secondary-text-color);
  }
  .title {
    font-weight: normal;
    padding: 0;
    margin: 0;
  }
</style>
