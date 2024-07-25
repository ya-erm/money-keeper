import { storable } from '$lib/storable';

const defaultBlocksOrder = {
  switch: 1,
  sourceAccount: 2,
  transferAccounts: 3,
  category: 4,
  destinationAccount: 5,
  dateTime: 6,
  amount: 7,
  comment: 8,
  tags: 9,
  save: 10,
};

export const blocksOrder = storable<Record<string, number>>(defaultBlocksOrder, 'blocksOrder');

export const amountInputAutofocus = storable(false, 'amountInputAutofocus');
