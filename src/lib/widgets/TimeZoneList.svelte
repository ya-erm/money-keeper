<script lang="ts">
  import dayjs from 'dayjs';
  import timezones from 'timezones-list';

  import { translate } from '$lib/translate';
  import Input from '$lib/ui/Input.svelte';
  import ListGroup from '$lib/ui/list/ListGroup.svelte';

  import TimeZoneListItem from './TimeZoneListItem.svelte';

  export let onClick: (timezone: string, shift: string) => void;
  export let showCurrentTimeZone = true;

  let search: string = '';

  $: items = timezones.filter(
    (tz) =>
      !search ||
      tz.label.toLowerCase().includes(search.toLowerCase()) ||
      tz.label.includes(search.replace(/([\+\-])(\d){1}/, '$10$2')),
  );

  const currentTimeZoneCode = dayjs.tz.guess();
  const currentTimeZone = timezones.find((timezone) => timezone.tzCode == currentTimeZoneCode);
</script>

<div class="flex-grow pt-1 px-1 pb-0">
  <Input bind:value={search} placeholder={$translate('common.search')} clearable />
</div>

{#if showCurrentTimeZone && currentTimeZone}
  <ListGroup title={$translate('common.current_time_zone')}>
    <TimeZoneListItem timezone={currentTimeZone} {onClick} />
  </ListGroup>
{/if}

<ListGroup title={$translate('common.available_variants')}>
  {#each items as timezone (timezone.tzCode)}
    <TimeZoneListItem {timezone} {onClick} />
  {/each}
</ListGroup>
