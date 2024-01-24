import type { Account, Category, Group, Tag, User } from '@prisma/client';

export type GroupWithUsers = Pick<Group, 'id' | 'name'> & {
  users: Pick<User, 'id' | 'name' | 'login'>[];
};

export type TransactionDto = {
  id: number;
  uuid: string;
  accountId: number;
  linkedTransactionId?: number | null;
  date: string;
  amount: number;
  comment: string | null;
  categoryId: number;
  tags: Tag[];
};

export type TransactionWithCategory = TransactionDto & {
  category: Category;
};

export type TransactionWithAccountAndCategory = TransactionWithCategory & {
  account: Account;
};

export type TransactionFullDto = TransactionWithAccountAndCategory & {
  linkedTransaction?: TransactionWithAccountAndCategory;
};

export type CategoryType = 'IN' | 'OUT';

export type ImportTransactionItem = {
  id: string;
  date: string;
  type: CategoryType;
  amount: number;
  comment?: string | null;
  checked: boolean;
  categoryId?: number;
  tags: Tag[];
  uniqueKey: string;
};

export type ImportedTransaction = {
  date: string;
  amount: number;
  comment?: string | null;
  categoryId: number;
  tags?: number[];
};

export type DateIntervalType = 'month' | 'custom';
