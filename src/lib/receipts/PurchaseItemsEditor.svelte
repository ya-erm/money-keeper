<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { translate } from '$lib/translate';
  import { calculateItemTotal, type PurchaseItemDraft } from './purchaseItems';

  export let items: PurchaseItemDraft[];

  const recalculate = (index: number) => {
    items[index].total = calculateItemTotal(items[index].quantity, items[index].unitPrice);
    items = [...items];
  };
  const updateNumber = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    items[index][field] = Number.isFinite(value) ? value : undefined;
    recalculate(index);
  };
  $: total = items.every((item) => item.total !== undefined && Number.isFinite(item.total))
    ? items.reduce((sum, item) => sum + (item.total as number), 0)
    : null;
</script>

<div class="flex-col gap-0.5" data-testId="PurchaseItemsEditor">
  {#if items.length}<div class="currency">RSD</div>{/if}
  {#each items as item, i (i)}
    <div class="purchase-item flex-col gap-0.5" data-testId="PurchaseItem">
      <div class="item-heading">
        <label class="item-name">
          <input
            type="text"
            aria-label={$translate('receipts.item')}
            bind:value={item.name}
            required
            maxlength="2048"
            data-testId="PurchaseItemName"
          />
        </label>
        <Button
          color="danger"
          appearance="transparent"
          bordered
          style="background: var(--header-background-color); height: var(--item-control-height); width: var(--item-control-height); padding: 0; flex-shrink: 0"
          aria-label={$translate('receipts.remove_item')}
          onClick={() => (items = items.filter((_, index) => index !== i))}
        >
          <Icon name="mdi:delete-outline" size={1.25} />
        </Button>
      </div>
      <div class="numbers">
        <label>
          <span>{$translate('receipts.quantity')}</span>
          <!-- Keep a fractional step base for weighed goods while the arrows move by one. -->
          <input
            type="number"
            min={item.quantity !== undefined && item.quantity % 1 > 0 ? item.quantity % 1 : 1}
            step="1"
            inputmode="decimal"
            required
            bind:value={item.quantity}
            on:input={(event) => updateNumber(i, 'quantity', event.currentTarget.valueAsNumber)}
            data-testId="PurchaseItemQuantity"
          />
        </label>
        <label>
          <span>{$translate('receipts.unit_price')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            required
            bind:value={item.unitPrice}
            on:input={(event) => updateNumber(i, 'unitPrice', event.currentTarget.valueAsNumber)}
            data-testId="PurchaseItemUnitPrice"
          />
        </label>
        <label>
          <span>{$translate('receipts.item_total')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            required
            bind:value={item.total}
            data-testId="PurchaseItemTotal"
          />
        </label>
      </div>
    </div>
  {/each}
  {#if items.length && total !== null}<div class="total">
      {$translate('receipts.item_total')}: {total.toFixed(2)}
    </div>{/if}
  <Button
    color="white"
    bordered
    text={$translate('receipts.add_item')}
    onClick={() => (items = [...items, { name: '', quantity: 1, unitPrice: undefined, total: undefined }])}
  />
</div>

<style>
  .purchase-item {
    --item-control-height: 2.75rem;
  }
  .purchase-item + .purchase-item {
    margin-top: 0.25rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color);
  }
  .currency {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
    text-align: right;
  }
  .item-heading {
    display: flex;
    gap: 0.5rem;
    align-items: end;
  }
  .item-name {
    flex: 1;
    min-width: 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }
  label span {
    font-size: 0.85rem;
  }
  input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: var(--item-control-height);
    padding: 0.65rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    background: var(--header-background-color);
    color: var(--primary-text-color);
    font: inherit;
  }
  input:focus {
    outline: 2px solid var(--active-color);
  }
  .numbers {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }
  .total {
    text-align: right;
  }
</style>
