<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  import { translate } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';

  import Icon from '$lib/ui/Icon.svelte';
  import Modal from '$lib/ui/Modal.svelte';
  import { amountInputAutofocus, blocksOrder } from './blocksOrderStore';
  import Input from '$lib/ui/Input.svelte';
  import Checkbox from '$lib/ui/Checkbox.svelte';

  export let opened = false;

  const flipDurationMs = 200;

  let defaultItemsOrder = [
    { id: 'switch', label: 'Тип операции' },
    { id: 'sourceAccount', label: 'Счёт откуда (для расходов)' },
    { id: 'transferAccounts', label: 'Счета откуда и куда (для переводов)' },
    { id: 'category', label: 'Категория' },
    { id: 'destinationAccount', label: 'Счёт куда (для доходов)' },
    { id: 'dateTime', label: 'Дата и время' },
    { id: 'amount', label: 'Сумма' },
    { id: 'comment', label: 'Комментарий' },
    { id: 'tags', label: 'Тэги' },
    { id: 'save', label: 'Кнопка сохранить' },
  ];

  let items = defaultItemsOrder.slice().sort((a, b) => $blocksOrder[a.id] ?? 0 < $blocksOrder[b.id] ?? 0);

  const handleDndConsider = (e: CustomEvent<DndEvent<(typeof items)[0]>>) => {
    items = e.detail.items;
  };

  const handleDndFinalize = (e: CustomEvent<DndEvent<(typeof items)[0]>>) => {
    items = e.detail.items;
    handleSaveBlocksOrder();
  };

  const handleSaveBlocksOrder = () => {
    const order = items.map((x) => x.id);
    const newBlocksOrder = order.reduce(
      (acc, item, i) => {
        acc[item] = i + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    blocksOrder.set(newBlocksOrder);
  };

  const handleReset = () => {
    items = defaultItemsOrder.slice();
    handleSaveBlocksOrder();
  };
</script>

<Modal bind:opened on:close={() => (opened = false)}>
  <div class="flex-col gap-1">
    <b class="text-center">Порядок элементов</b>
    <ul
      use:dndzone={{
        items,
        dropTargetStyle: {},
        flipDurationMs,
      }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#each items as item (item.id)}
        <li animate:flip={{ duration: flipDurationMs }} class="flex">
          <Icon name="mdi:drag" />
          {item.label}
        </li>
      {/each}
    </ul>
    <Checkbox
      label="Автофокус поля Сумма"
      checked={$amountInputAutofocus}
      onChange={(value) => amountInputAutofocus.set(value)}
    />
    <div class="grid-col-2 gap-1">
      <Button color="secondary" appearance="transparent" bordered on:click={handleReset}>
        {$translate('common.reset')}
      </Button>
      <Button on:click={() => (opened = false)}>Закрыть</Button>
    </div>
  </div>
</Modal>

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
