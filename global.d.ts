/* eslint-disable @typescript-eslint/no-explicit-any */

declare type Item = import('svelte-dnd-action').Item;
declare type DndEvent<ItemType = Item> = import('svelte-dnd-action').DndEvent<ItemType>;
declare namespace svelte.JSX {
  export interface HTMLAttributes<T> {
    onconsider?: (event: CustomEvent<DndEvent<any>> & { target: EventTarget & T }) => void;
    onfinalize?: (event: CustomEvent<DndEvent<any>> & { target: EventTarget & T }) => void;
  }
}
