import type { DBSchema } from 'idb';

import type { Snapshot } from './snapshot';

export type WithOwner<T> = T & { owner: string };

export type Initialisable = {
  init: () => Promise<void>;
};

export type Service = Initialisable & JournalSubscriber;

export type GlobalSettings = {
  id: 'global';
  selectedMember?: string | null;
  hideBalances?: boolean;
  selectedParticipants?: Record<string, string>;
};

export type Member = {
  uuid: string;
  login?: string | null;
  publicKey: string;
  privateKey: string;
};

export type EncryptionVersion = 'none' | 'aes+rsa-v1';

export type MemberSettings = {
  walletsEnabled?: boolean;
  syncNumber: number;
  currency?: string | null;
  encryption?: EncryptionVersion;
  accountsOrder?: string[];
  categoriesInOrder?: string[];
  categoriesOutOrder?: string[];
  lastAnotherCurrency?: string | null;
  lastDebtCurrency?: string | null;
  favoriteTimeZones?: string[];
  groupingId?: string | null;
  knownPlaces?: KnownPlace[];
  autoDetectLocation?: boolean;
};

export type KnownPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type JournalItem = {
  order: number;
  data: JournalOperation;
};

export type JournalOperation = {
  walletsEnabled?: boolean;
  participant?: Participant;
  virtualWallet?: VirtualWallet;
  walletTransfer?: WalletTransfer;
  debtContact?: DebtContact;
  debtRecord?: DebtRecord;
  category?: Category;
  account?: Account;
  accountTag?: Tag;
  transaction?: Transaction;
  currencyRate?: CurrencyRate;
  tag?: Tag;
  accountsOrder?: string[];
  categoriesInOrder?: string[];
  categoriesOutOrder?: string[];
  knownPlaces?: KnownPlace[];
  grouping?: Grouping;
  repeating?: Repeating;
  /**
   * Full state written by journal compaction, replaces everything before it.
   * Deleted accounts, categories and tags are kept (with `deleted: true`), deleted operations are dropped.
   */
  snapshot?: Snapshot;
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
  hideBalance?: boolean;
  showReceiptScanButton?: boolean;
};

export type AccountViewModel = Account & {
  tags: Tag[];
};

/** A profile within the existing workspace, independent of authentication. */
export type Participant = {
  id: string;
  name: string;
  avatarColor?: string;
  avatarIcon?: string;
  /** Private avatar object ID, scoped to the authenticated workspace. */
  avatarId?: string;
  accountsOrder?: string[];
  walletsOrder?: string[];
  /** @deprecated Retained for older backups; participant visibility is no longer applied. */
  hiddenAccountIds?: string[];
  /** @deprecated Retained for older backups; participant visibility is no longer applied. */
  hiddenWalletIds?: string[];
  currency?: string;
  allocationPreset?: 'first' | 'other' | 'equal';
  archived?: boolean;
  deleted?: boolean;
};

/** A multi-currency envelope, independent of where the money is held. */
export type VirtualWallet = {
  icon?: string;
  id: string;
  name: string;
  participantId?: string;
  archived?: boolean;
  deleted?: boolean;
};

export type WalletAllocation = { shares: { walletId: string; amount: number }[] };

/** No bank movement. An absent endpoint denotes the unallocated balance. */
export type WalletTransfer = {
  id: string;
  currency: string;
  fromWalletId?: string;
  toWalletId?: string;
  amount: number;
  date: string;
  comment?: string;
  /** Budget contributor, not the author. Preserved if wallet ownership changes. */
  contributorParticipantId?: string;
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

export type VerificationStatus =
  /** Operation matches the bank statement */
  | 'ok'
  /** Similar operation found in the bank statement, but date or amount differs */
  | 'mismatch'
  /** Operation is not found in the bank statement of its period */
  | 'missing';

/** Result of the reconciliation with a bank statement */
export type Verification = {
  status: VerificationStatus;
  /** Identifier of the bank statement, e.g. "2026-08" */
  statement: string;
  /** Values from the bank statement, filled for `mismatch` */
  expected?: {
    date?: string;
    amount?: number;
  } | null;
};

export type PurchaseItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

/** A privately managed contact, independent of workspace members and authentication. */
export type ContactGrammaticalForm = 'masculine' | 'feminine' | 'neuter' | 'plural';

export type DebtContact = {
  id: string;
  name: string;
  createdAt?: string;
  note?: string;
  /** Grammatical agreement, also available for future avatar placeholders. */
  grammaticalForm?: ContactGrammaticalForm;
  archived?: boolean;
  deleted?: boolean;
};

/** A starting balance / IOU without movement on an account. Positive means owed to me. */
export type DebtRecord = {
  id: string;
  kind?: 'debt' | 'repayment';
  contactId: string;
  amount: number;
  currency: string;
  date: string;
  comment?: string;
  dueDate?: string;
  deleted?: boolean;
};

export type DebtShare = {
  contactId: string;
  amount: number;
  /** Defaults to the operation's account currency. */
  currency?: string;
};

/** Stored atomically with the actual payment, so edits and deletion cannot leave orphan debts. */
export type TransactionDebt = {
  kind: 'expense' | 'loan' | 'repayment' | 'payment';
  shares: DebtShare[];
  /** Manual personal income/expense amount in the account currency, including zero. */
  personalAmount?: number;
  dueDate?: string;
};

// TODO: rename to Operation
// after adding new field don't forget to change function cloneOperation
export type Transaction = {
  walletAllocation?: WalletAllocation;
  debt?: TransactionDebt;
  id: string;
  accountId: string;
  categoryId: string;
  date: string;
  timeZone?: string | null;
  amount: number;
  comment?: string | null;
  /** Technical description, e.g. operation name as it is written in the bank statement */
  description?: string | null;
  /** Fiscal receipt reference, independent of the bank statement description. */
  receiptUrl?: string | null;
  /** Hidden organization name from receipt merchant details, used to reuse the user's comment and category. */
  receiptOrganizationName?: string | null;
  /** Hidden store address and city from the receipt, used to reuse a previous operation's location. */
  receiptAddress?: string | null;
  /** Individual purchase items from the fiscal receipt. */
  purchaseItems?: PurchaseItem[];
  /** Result of the reconciliation with a bank statement, absent if the operation was not checked yet */
  verification?: Verification | null;
  linkedTransactionId?: string | null;
  anotherCurrency?: string | null;
  anotherCurrencyAmount?: number | null;
  excludeFromAnalysis?: boolean;
  tagIds?: string[];
  repeatingId?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  deleted?: boolean;
};

type TransactionWithAccountAndCategory = Transaction & {
  account: Account;
  category: Category;
};

export type TransactionViewModel = TransactionWithAccountAndCategory & {
  linkedTransaction?: TransactionWithAccountAndCategory;
  repeating?: Repeating;
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

export type Repeating = {
  id: string;
  count: number;
  interval: 'day' | 'week' | 'month' | 'year';
  dayOfMonth?: number;
  endDate?: string;
  deleted?: boolean;
};

export interface LocalDB extends DBSchema {
  participants: {
    key: string;
    value: WithOwner<Participant>;
    indexes: { 'by-owner': string };
  };
  virtualWallets: {
    key: string;
    value: WithOwner<VirtualWallet>;
    indexes: { 'by-owner': string };
  };
  walletTransfers: {
    key: string;
    value: WithOwner<WalletTransfer>;
    indexes: { 'by-owner': string };
  };
  debtContacts: {
    key: string;
    value: WithOwner<DebtContact>;
    indexes: { 'by-owner': string };
  };
  debtRecords: {
    key: string;
    value: WithOwner<DebtRecord>;
    indexes: { 'by-owner': string };
  };
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
    key: [string, number];
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
  repeatings: {
    key: string;
    value: WithOwner<Repeating>;
    indexes: { 'by-owner': string };
  };
}

export type DateIntervalType = 'month' | 'custom';
