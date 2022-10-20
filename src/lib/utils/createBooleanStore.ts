import { writable, type Writable } from 'svelte/store';

type CreateBooleanStoreReturn = [
  /** value */
  Writable<boolean>,
  /** set true */
  () => void,
  /** set false */
  () => void,
  /** toggle */
  () => void,
];

export const createBooleanStore = (defaultValue?: boolean): CreateBooleanStoreReturn => {
  const store = writable(defaultValue ?? false);

  const setTrue = () => store.set(true);
  const setFalse = () => store.set(false);
  const toggle = () => store.update((value) => !value);

  return [store, setTrue, setFalse, toggle];
};

export default createBooleanStore;
