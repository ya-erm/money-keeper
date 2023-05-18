import type { TransactionDto } from '$lib/interfaces';
import { Prisma, type Tag, type Transaction } from '@prisma/client';

type TransactionDbo = Pick<
  Transaction,
  'id' | 'uuid' | 'accountId' | 'categoryId' | 'linkedTransactionId' | 'date' | 'amount' | 'comment'
>;

type TransactionWithTagsDbo = TransactionDbo & {
  tags: Tag[];
};

export const transactionSelection = Prisma.validator<Prisma.TransactionSelect>()({
  id: true,
  uuid: true,
  accountId: true,
  categoryId: true,
  linkedTransactionId: true,
  date: true,
  amount: true,
  comment: true,
  tags: true,
});

export const mapTransaction = (
  t: TransactionWithTagsDbo,
  linkedTransaction: TransactionDbo | null,
): TransactionDto => ({
  id: t.id,
  uuid: t.uuid,
  accountId: t.accountId,
  categoryId: t.categoryId,
  amount: t.amount,
  comment: t.comment,
  date: t.date.toISOString(),
  tags: t.tags,
  ...(linkedTransaction
    ? {
        linkedTransactionId: t.linkedTransactionId,
        linkedTransaction,
      }
    : {}),
});
