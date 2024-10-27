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

export type EncryptionVersion = 'none' | 'aes+rsa-v1';

export type MemberSettings = {
  syncNumber: number;
  currency?: string | null;
  encryption?: EncryptionVersion;
  accountsOrder?: string[];
  categoriesInOrder?: string[];
  categoriesOutOrder?: string[];
  lastAnotherCurrency?: string | null;
  favoriteTimeZones?: string[];
  groupingId?: string | null;
};

export type JournalItem = {
  order: number;
  data: JournalOperation;
};

export type JournalOperation = {
  category?: Category;
  account?: Account;
  accountTag?: Tag;
  transaction?: Transaction;
  currencyRate?: CurrencyRate;
  tag?: Tag;
  accountsOrder?: string[];
  categoriesInOrder?: string[];
  categoriesOutOrder?: string[];
  grouping?: Grouping;
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
  system?: boolean;
  deleted?: boolean;
};

export type Account = {
  id: string;
  name: string;
  currency: string;
  icon?: string | null;
  color?: string;
  tagIds?: string[];
  deleted?: boolean;
  archived?: boolean;
};

export type AccountViewModel = Account & {
  tags: Tag[];
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

// TODO: rename to Operation
// after adding new field don't forget to change function copyOperation
export type Transaction = {
  id: string;
  accountId: string;
  categoryId: string;
  date: string;
  timeZone?: string | null;
  amount: number;
  comment?: string | null;
  description?: string | null;
  linkedTransactionId?: string | null;
  anotherCurrency?: string | null;
  anotherCurrencyAmount?: number | null;
  excludeFromAnalysis?: boolean;
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

export type Grouping = {
  id: string;
  name: string;
  groups?: Group[];
  deleted?: boolean;
};

export type Group = {
  id: string;
  name: string;
  color?: string;
  accountIds?: string[];
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
  accountTags: {
    key: string;
    value: WithOwner<Tag>;
    indexes: { 'by-owner': string };
  };
  currencyRates: {
    key: string;
    value: WithOwner<CurrencyRate>;
    indexes: { 'by-owner': string };
  };
  groupings: {
    key: string;
    value: WithOwner<Grouping>;
    indexes: { 'by-owner': string };
  };
}

export type DateIntervalType = 'month' | 'custom';
