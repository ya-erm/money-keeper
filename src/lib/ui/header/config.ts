import type { Component } from './model';

export type HeaderConfig = {
  backButton?: {
    href?: string;
    onClick?: () => void;
    title?: string;
  };
  leftButton?: Component | null;
  title?: string;
  rightButton?: Component | null;
};
