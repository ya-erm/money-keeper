import { writable, type Readable, type Writable } from 'svelte/store';

type StoreType<T> = Writable<T> & {
  readable: Readable<T>;
  readonly value: T;
};

export class Store<T> implements StoreType<T> {
  private _value: T;
  private _writable: Writable<T>;

  constructor(defaultValue: T) {
    this._value = defaultValue;
    this._writable = writable(defaultValue);
    this._writable.subscribe((value) => (this._value = value));
  }

  get value() {
    return this._value;
  }

  get readable() {
    return this._writable as Readable<T>;
  }

  set(value: T) {
    this._writable.set(value);
  }

  update(updater: (value: T) => T) {
    this._writable.update(updater);
  }

  subscribe(run: (value: T) => void, invalidate?: (value?: T) => void) {
    return this._writable.subscribe(run, invalidate);
  }
}

export const store = <T>(defaultValue: T): Store<T> => new Store(defaultValue);
