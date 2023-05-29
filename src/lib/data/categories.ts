import { derived } from 'svelte/store';
import type { Category } from './interfaces';
import { BaseService } from './service';

export class CategoriesService extends BaseService<Category> {
  private _categories: Category[] = [];
  private _categoryStore;

  constructor() {
    super('CategoriesService', 'categories', 'category');

    this._categoryStore = derived(this.$items, (items) => this.mapItems(items));
    this._categoryStore.subscribe((items) => (this._categories = items));
  }

  get categories() {
    return this._categories;
  }

  get $categories() {
    return this._categoryStore;
  }

  private mapItems(items: Category[]) {
    return items.filter((category) => !category.system);
  }
}

export const categoriesService = new CategoriesService();

export const SYSTEM_CATEGORY_TRANSFER_IN: Category = {
  id: '00000000-0001-0001-b91e-1a1822f82ab9',
  type: 'IN',
  name: 'system.category.transfer_in',
  icon: 'mdi:swap-horizontal',
  system: true,
};

export const SYSTEM_CATEGORY_TRANSFER_OUT: Category = {
  id: '00000000-0001-0002-8ff6-187bca92f3f9',
  type: 'OUT',
  name: 'system.category.transfer_out',
  icon: 'mdi:swap-horizontal',
  system: true,
};
