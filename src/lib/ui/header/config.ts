import type { SvelteComponent } from 'svelte';

export type HeaderConfig = {
  backButton?: {
    href?: string;
    onClick?: () => void;
    title?: string;
  };
  leftButton?: typeof SvelteComponent | null;
  title?: string;
  rightButton?: typeof SvelteComponent | null;
};
