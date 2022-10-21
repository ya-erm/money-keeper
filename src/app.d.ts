// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  interface Locals {
    user: {
      id: number;
      name: string;
    } | null;
  }
  interface PageData {
    user: {
      id: number;
      name: string;
    } | null;
  }
  // interface Error {}
  // interface Platform {}
}
