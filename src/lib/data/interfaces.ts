import type { DBSchema } from 'idb';

export type WithOwner<T> = T & { owner: string };

export type Initialisable = {
  init: () => Promise<void>;
};

export type Service = Initialisable & JournalSubscriber;

export type GlobalSettings = {
  id: 'global';
  selectedMember?: string | null;
};

export type Member = {
  uuid: string;
  login?: string | null;
  publicKey: string;
  privateKey: string;
};

export type MemberSettings = {
  syncNumber: number;
};

export type JournalItem = {
  order: number;
  data: JournalOperation;
};

export type JournalOperation = {
  category?: Category;
  account?: Account;
  transaction?: Transaction;
  currencyRate?: CurrencyRate;
  tag?: Tag;
};

export type JournalSubscriber = {
  name: string;
  applyChanges: (changes: JournalItem[], saveToDB: boolean) => Promise<void> | void;
};

export type CategoryType = 'IN' | 'OUT';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  deleted?: boolean;
};

export type Account = {
  id: string;
  name: string;
  order: number;
  currency: string;
  icon?: string | null;
  deleted?: boolean;
};

export type Tag = {
  id: string;
  name: string;
  deleted?: boolean;
};

export type CurrencyRate = {
  id: string;
  cur1: string;
  cur2: string;
  rate: number;
  deleted?: boolean;
};

export type Transaction = {
  id: string;
  accountId: string;
  categoryId: string;
  date: string;
  amount: number;
  comment?: string | null;
  description?: string | null;
  linkedTransactionId?: string | null;
  tagIds?: string[];
  deleted?: boolean;
};

type TransactionWithAccountAndCategory = Transaction & {
  account: Account;
  category: Category;
};

export type TransactionViewModel = TransactionWithAccountAndCategory & {
  linkedTransaction?: TransactionWithAccountAndCategory;
  tags: Tag[];
};

export interface LocalDB extends DBSchema {
  globalSettings: {
    key: string;
    value: GlobalSettings;
  };
  members: {
    key: string;
    value: Member;
  };
  memberSettings: {
    key: string;
    value: WithOwner<MemberSettings>;
    indexes: { 'by-owner': string };
  };
  journal: {
    key: string;
    value: WithOwner<JournalItem>;
    indexes: { 'by-owner': string };
  };
  categories: {
    key: string;
    value: WithOwner<Category>;
    indexes: { 'by-owner': string };
  };
  accounts: {
    key: string;
    value: WithOwner<Account>;
    indexes: { 'by-owner': string };
  };
  transactions: {
    key: string;
    value: WithOwner<Transaction>;
    indexes: {
      'by-owner': string;
      'by-owner-account': [string, string];
      'by-owner-category': [string, string];
    };
  };
  tags: {
    key: string;
    value: WithOwner<Tag>;
    indexes: { 'by-owner': string };
  };
  currencyRates: {
    key: string;
    value: WithOwner<CurrencyRate>;
    indexes: { 'by-owner': string };
  };
}