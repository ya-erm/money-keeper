import dayjs from 'dayjs';

import type { TransactionViewModel } from '$lib/data/interfaces';

export const operationBeforeDatePredicate = (date: Date) => (operation: TransactionViewModel) =>
  dayjs(operation.date).isBefore(date);

export const operationAfterDatePredicate = (date: Date) => (operation: TransactionViewModel) =>
  dayjs(operation.date).isAfter(date);

export const pastOperationsPredicate = () => operationBeforeDatePredicate(new Date());
export const futureOperationsPredicate = () => operationAfterDatePredicate(new Date());
