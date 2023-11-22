import { writable, type Readable, type Writable } from 'svelte/store';

type StoreType<T> = Writable<T> & {
  readable: Readable<T>;
  readonly value: T;
};

export class Store<T> implements StoreType<T> {
  private _value: T;
  private _defaultValue: T;
  private _writable: Writable<T>;

  constructor(defaultValue: T) {
    this._value = defaultValue;
    this._defaultValue = defaultValue;
    this._writable = writable(defaultValue);
    this._writable.subscribe((value) => (this._value = value));
  }

  get value() {
    return this._value;
  }

  get readable() {
    return this._writable as Readable<T>;
  }

  /**
   * Set value and inform subscribers.
   * @param value to set
   */
  set(value: T) {
    this._writable.set(value);
  }

  /**
   * Update value using callback and inform subscribers.
   * @param updater callback
   */
  update(updater: (value: T) => T) {
    this._writable.update(updater);
  }

  /**
   * Subscribe on value changes.
   * @param run subscription callback
   * @param invalidate cleanup callback
   */
  subscribe(run: (value: T) => void, invalidate?: (value?: T) => void) {
    return this._writable.subscribe(run, invalidate);
  }

  /** Resets the store to its default value */
  reset() {
    this._writable.set(this._defaultValue);
  }
}

export const store = <T>(defaultValue: T): Store<T> => new Store(defaultValue);
