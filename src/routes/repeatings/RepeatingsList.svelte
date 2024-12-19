<script lang="ts">
  import { page } from '$app/stores';

  import { currencyRatesStore, memberSettingsStore, operationsStore } from '$lib/data';
  import type { Repeating } from '$lib/data/interfaces';
  import { repeatingsService } from '$lib/data/repeatings';
  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import ButtonBase from '$lib/ui/ButtonBase.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import { deleteSearchParam, findCurrencyRate, getSearchParam, groupBySelector, setSearchParam } from '$lib/utils';
  import { goBack } from '$lib/utils/goBack';

  import TransactionListItem from '../transactions/TransactionListItem.svelte';
  import RepeatingIntervalText from './RepeatingIntervalText.svelte';
  import RepeatingModal from './RepeatingModal.svelte';

  export let repeatings: Repeating[];
  export let onClick: (item: Repeating) => void = (repeating: Repeating) => {
    void openRepeatingModal(repeating.id);
  };

  $: operations = $operationsStore;
  $: currencyRates = $currencyRatesStore;
  $: settings = $memberSettingsStore;

  $: operationsByRepeatings = groupBySelector(operations ?? [], (operation) => operation.repeatingId ?? 'none');

  $: repeatingId = getSearchParam($page, 'repeating-id');
  const openRepeatingModal = (id: string) => setSearchParam($page, 'repeating-id', id, { replace: false });
  const closeRepeatingModal = () => goBack(() => void deleteSearchParam($page, 'repeating-id'));

  const handleSubmitRepeating = (repeating: Repeating) => {
    repeatingsService.save(repeating);
    closeRepeatingModal();
  };

  const handleDeleteRepeating = (repeating: Repeating | undefined) => {
    if (!repeating) return;
    repeatingsService.delete(repeating);
  };
</script>

<ul class="flex-col gap-1">
  {#each repeatings as repeating (repeating.id)}
    {@const repeatingOperations = operationsByRepeatings[repeating.id] ?? []}
    <li class="item flex-col">
      <ButtonBase on:click={() => onClick(repeating)} class="w-full flex-col gap-0.5">
        <div class="w-full flex items-center gap-0.5 justify-between">
          <span class="title">
            <RepeatingIntervalText
              count={repeating.count}
              interval={repeating.interval}
              dayOfMonth={repeating.dayOfMonth}
              date={repeatingOperations[0]?.date}
            />
          </span>
          <Icon name="mdi:chevron-right" />
        </div>
        <div class="w-full flex-col">
          {#if operationsByRepeatings[repeating.id]?.length}
            <TransactionListItem
              transaction={repeatingOperations[0]}
              currencyRate={findCurrencyRate(
                currencyRates,
                settings?.currency,
                repeatingOperations[0].account.currency,
              )}
            />
          {:else}
            <div class="flex items-center gap-1">
              <div class="icon flex-center">
                <Icon name="mdi:folder-cancel-outline" size={1.75} padding={0.75} />
              </div>
              <div class="flex-col items-start">
                <span>{$translate('repeatings.empty_repeating')}</span>
                <span class="info">{$translate('repeatings.empty_repeating.info')}</span>
              </div>
            </div>
          {/if}
        </div>
      </ButtonBase>
    </li>
  {/each}
</ul>

{#if repeatingId}
  {@const selectedRepeating = repeatings.find((item) => item.id === repeatingId)}
  {@const repeatingOperations = operationsByRepeatings[repeatingId] ?? []}
  <RepeatingModal
    repeating={selectedRepeating}
    operations={repeatingOperations}
    date={repeatingOperations[0]?.date}
    opened={!!selectedRepeating}
    onSubmit={handleSubmitRepeating}
    onCancel={closeRepeatingModal}
  >
    {#if !repeatingOperations.length}
      <Button
        on:click={() => handleDeleteRepeating(selectedRepeating)}
        text={$translate('common.delete')}
        appearance="transparent"
        color="danger"
        bordered
      />
    {/if}
  </RepeatingModal>
{/if}

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .item {
    position: relative;
    cursor: pointer;
  }
  .item:focus-visible {
    outline-offset: 2px;
    outline: 2px solid var(--active-color);
  }
  @media (hover: hover) {
    .item:hover {
      opacity: 0.7;
    }
  }
  .item:not(:first-child)::before {
    content: '';
    position: absolute;
    top: -0.5rem;
    background-color: var(--border-color);
    height: 1px;
    width: 100%;
  }
  .icon {
    border-radius: 100%;
    background-color: var(--header-background-color);
  }
  .info {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
</style>
