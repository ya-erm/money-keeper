// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

type UserInfo = {
  id: number;
  login: string;
  name: string;
};

declare namespace App {
  interface Locals {
    user: UserInfo | null;
  }
  interface PageData {
    user: UserInfo | null;
  }
  // interface Error {}
  // interface Platform {}
}
