import type { DBSchema } from 'idb';

type WithOwner<T> = T & { owner: string };

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
}
