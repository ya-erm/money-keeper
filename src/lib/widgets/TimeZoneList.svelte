<script lang="ts">
  import dayjs from 'dayjs';
  import timezones from 'timezones-list';

  import { memberSettingsStore, membersService } from '$lib/data';
  import { translate } from '$lib/translate';
  import Input from '$lib/ui/Input.svelte';
  import ListGroup from '$lib/ui/list/ListGroup.svelte';
  import { showSuccessToast } from '$lib/ui/toasts';

  import TimeZoneListItem from './TimeZoneListItem.svelte';

  export let onClick: (timezone: string, shift: string) => void;
  export let showCurrentTimeZone = true;

  $: settings = $memberSettingsStore;

  let search: string = '';

  $: filteredTimeZones = timezones.filter(
    (tz) =>
      !search ||
      tz.label.toLowerCase().includes(search.toLowerCase()) ||
      tz.label.includes(search.replace(/([+-])(\d){1}/, '$10$2')),
  );

  const currentTimeZoneCode = dayjs.tz.guess();
  const currentTimeZone = timezones.find((timezone) => timezone.tzCode == currentTimeZoneCode);

  $: favoriteTimeZones = timezones.filter((timezone) => settings?.favoriteTimeZones?.includes(timezone.tzCode));

  const addToFavorite = (timezone: string) => {
    membersService.updateSettings({
      favoriteTimeZones: [...(settings?.favoriteTimeZones ?? []), timezone],
    });
    showSuccessToast($translate('timezones.timezone_added_to_favorites'));
  };

  const removeFromFavorite = (timezone: string) => {
    membersService.updateSettings({
      favoriteTimeZones: settings?.favoriteTimeZones?.filter((x) => x !== timezone) ?? [],
    });
    showSuccessToast($translate('timezones.timezone_removed_from_favorites'));
  };
</script>

<div class="flex-grow pt-1 px-1 pb-0">
  <Input bind:value={search} placeholder={$translate('common.search')} clearable />
</div>

{#if showCurrentTimeZone && currentTimeZone}
  <ListGroup title={$translate('timezones.current_time_zone')}>
    <TimeZoneListItem timezone={currentTimeZone} {onClick} />
  </ListGroup>
{/if}

{#if favoriteTimeZones.length > 0}
  <ListGroup title={$translate('timezones.favorite_time_zones')}>
    {#each favoriteTimeZones as timezone (timezone.tzCode)}
      <TimeZoneListItem {timezone} {onClick} onLongClick={removeFromFavorite} />
    {/each}
  </ListGroup>
{/if}

<ListGroup title={$translate('timezones.all_time_zones')}>
  {#each filteredTimeZones as timezone (timezone.tzCode)}
    <TimeZoneListItem {timezone} {onClick} onLongClick={addToFavorite} />
  {/each}
</ListGroup>

<div class="pb-1" />
