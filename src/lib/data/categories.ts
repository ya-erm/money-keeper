import { derived } from 'svelte/store';
import type { Category } from './interfaces';
import { memberSettingsStore } from './members';
import { BaseService } from './service';

export class CategoriesService extends BaseService<Category> {
  private _categoryStore;

  constructor() {
    super('CategoriesService', 'categories', 'category');

    this._categoryStore = derived([this.$items, memberSettingsStore], ([items, settings]) =>
      this.mapItems(items, settings?.categoriesInOrder, settings?.categoriesOutOrder),
    );
  }

  get $categories() {
    return this._categoryStore;
  }

  private mapItems(items: Category[], categoriesInOrder: string[] = [], categoriesOutOrder: string[] = []): Category[] {
    function getCategoryOrder(category: Category) {
      const order = category.type === 'IN' ? categoriesInOrder : categoriesOutOrder;
      const index = order.findIndex((id) => id === category.id);
      return index < 0 ? items.length : index;
    }

    return items.filter((category) => !category.system).sort((a, b) => getCategoryOrder(a) - getCategoryOrder(b));
  }
}

export const categoriesService = new CategoriesService();

export const categoriesStore = categoriesService.$categories;

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
