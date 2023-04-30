// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

declare namespace App {
  interface Locals {
    userId: number | null;
    groupId: number | null;
    uuid: string | null;
  }
  interface PageData {
    userId: number | null;
    groupId: number | null;
    uuid?: string | null;
  }
  // interface Error {}
  // interface Platform {}
}
