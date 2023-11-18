<script lang="ts">
  import dayjs from 'dayjs';
  import { onMount } from 'svelte';

  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import InputLabel from '$lib/ui/InputLabel.svelte';
  import Tags from '$lib/ui/Tags.svelte';
  import { LogLevel, logs } from '$lib/utils/logger';

  let filtersVisible = false;

  $: loggers = [...new Set($logs.map((log) => log.logger))];
  $: loggerOptions = loggers.map((logger) => ({ id: logger.name, title: logger.name }));
  let selectedLoggers: string[] = [];

  const levelsOptions = [LogLevel.debug, LogLevel.log, LogLevel.warn, LogLevel.error].map((level) => ({
    id: `${level}`,
    title: mapLogLevel(level),
  }));
  let selectedLevels = levelsOptions.map((option) => option.id);

  onMount(() => {
    selectedLoggers = loggers.map((logger) => logger.name);
  });

  $: filteredLogs = $logs.filter(
    (log) => selectedLoggers.includes(log.logger.name) && selectedLevels.includes(`${log.level}`),
  );

  function mapLogLevel(level: LogLevel) {
    switch (level) {
      case LogLevel.debug:
        return 'Debug';
      case LogLevel.log:
        return 'Info';
      case LogLevel.warn:
        return 'Warning';
      case LogLevel.error:
        return 'Error';
    }
  }
</script>

<div class="p-1">
  <Button appearance="link" underlined={false} on:click={() => (filtersVisible = !filtersVisible)}>
    <div class="flex items-center">
      <span>{$translate(filtersVisible ? 'settings.logs.hide_filters' : 'settings.logs.show_filters')}</span>
      <Icon padding={0} name={filtersVisible ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
    </div>
  </Button>
  {#if filtersVisible}
    <div class="mt-0.5 flex-col gap-0.5">
      <InputLabel text="Levels:" />
      <Tags
        tags={levelsOptions}
        selected={selectedLevels}
        onChange={(id, selected) =>
          (selectedLevels = selected ? selectedLevels.concat(id) : selectedLevels.filter((x) => x !== id))}
        readOnly
      />
    </div>

    <div class="mt-0.5 flex-col gap-0.5">
      <InputLabel text="Loggers:" />
      <Tags
        tags={loggerOptions}
        selected={selectedLoggers}
        onChange={(id, selected) =>
          (selectedLoggers = selected ? selectedLoggers.concat(id) : selectedLoggers.filter((x) => x !== id))}
        readOnly
      />
    </div>
  {/if}
</div>

<ul class="flex-col gap-1">
  {#each filteredLogs as log}
    <li class="flex-col">
      <div class="flex gap-0.5 header">
        <span>
          <span>{dayjs(log.timestamp).format('HH:mm:ss')}</span>
          <span class="ms">{dayjs(log.timestamp).format('.SSS')}</span>
        </span>
        <span>|</span>
        <span style:color={log.logger.color}>{log.logger.name}</span>
        <span>|</span>
        <span class={`level-${log.level}`}>{mapLogLevel(log.level)}</span>
      </div>
      <pre class="message">{log.args.map((x) => JSON.stringify(x, undefined, 2)).join(' ')}</pre>
    </li>
  {/each}
</ul>

<style>
  ul {
    padding: 0 1rem;
    list-style: none;
  }
  .header {
    font-size: 0.85em;
    margin-bottom: 0.25rem;
  }
  .ms {
    font-size: 0.85em;
    margin-left: -4px;
    opacity: 0.8;
  }
  .level-0 {
    color: var(--secondary-text-color, gray);
  }
  .level-1 {
    color: var(--active-color, blue);
  }
  .level-2 {
    color: var(--orange-color, orange);
  }
  .level-3 {
    color: var(--red-color, red);
  }
  .message {
    white-space: pre;
    overflow-x: auto;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    padding: 0.5rem;
    margin: 0;
  }
</style>
