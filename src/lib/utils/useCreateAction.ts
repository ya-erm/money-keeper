import { Store } from '$lib/store';
import type { Page } from '@sveltejs/kit';
import type { Readable } from 'svelte/store';
import { deleteSearchParam, getSearchParam } from './getSearchParam';

export const useCreateAction = <T>($page: Readable<Page>) => new UseCreateActionResult<T>($page);

class UseCreateActionResult<T> {
  private _item: Store<T | null>;
  private _opened: Store<boolean>;

  constructor($page: Readable<Page>) {
    this._item = new Store<T | null>(null);
    this._opened = new Store(false);

    let _page: Page | null = null;

    $page.subscribe((page) => {
      _page = page;
      const action = getSearchParam(page, 'action');
      if (action === 'create') {
        this._opened.set(true);
        this._item.set(null);
      }
    });

    this._opened.subscribe((value) => {
      if (!value && _page) {
        void deleteSearchParam(_page, 'action');
      }
    });
  }

  get item() {
    return this._item.value;
  }

  set item(value: T | null) {
    this._item.set(value);
  }

  get opened() {
    return this._opened.value;
  }

  set opened(value: boolean) {
    this._opened.set(value);
  }
}
