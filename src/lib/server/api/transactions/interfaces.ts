import type { TransactionDto } from '$lib/interfaces';
import { Prisma, type Transaction } from '@prisma/client';

type TransactionDbo = Pick<
  Transaction,
  'id' | 'accountId' | 'categoryId' | 'linkedTransactionId' | 'date' | 'amount' | 'comment'
>;

export const transactionSelection = Prisma.validator<Prisma.TransactionSelect>()({
  id: true,
  accountId: true,
  categoryId: true,
  linkedTransactionId: true,
  date: true,
  amount: true,
  comment: true,
});

export const mapTransaction = (t: TransactionDbo, linkedTransaction: TransactionDbo | null): TransactionDto => ({
  id: t.id,
  accountId: t.accountId,
  categoryId: t.categoryId,
  amount: t.amount,
  comment: t.comment,
  date: t.date.toISOString(),
  ...(linkedTransaction
    ? {
        linkedTransactionId: t.linkedTransactionId,
        linkedTransaction,
      }
    : {}),
});
