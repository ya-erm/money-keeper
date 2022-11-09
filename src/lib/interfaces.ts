import type { Account, Category, Group, Transaction, User } from '@prisma/client';

export type GroupWithUsers = Pick<Group, 'id' | 'name'> & {
  users: Pick<User, 'id' | 'name' | 'login'>[];
};

export type TransactionWithCategory = Transaction & {
  category: Category;
};

export type TransactionWithAccountAndCategory = Transaction & {
  account: Account;
  category: Category;
};

export type CategoryType = 'IN' | 'OUT';

export type ImportTransactionItem = {
  date: string;
  type: CategoryType;
  amount: number;
  comment?: string | null;
  checked: boolean;
  categoryId?: number;
};

export type ImportedTransaction = {
  date: string;
  amount: number;
  comment?: string | null;
  categoryId: number;
};
