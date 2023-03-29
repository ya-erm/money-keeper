import type { DBSchema } from 'idb';

export type CategoryType = 'IN' | 'OUT';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  deleted?: boolean;
};

export interface LocalDB extends DBSchema {
  categories: {
    key: string;
    value: Category;
  };
}
