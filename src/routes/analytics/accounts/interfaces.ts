import type { AccountViewModel, Group } from '$lib/data/interfaces';

export type AccountSummary = {
  account: AccountViewModel;
  balance: number;
  ratedBalance: number;
  color: string;
};

export type AccountSummaryPercentaged = AccountSummary & {
  percentages: number;
};

export type GroupSummary = {
  groupId: string;
  group?: Group;
  ratedBalance: number;
  percentages: number;
  accountSummaries: AccountSummaryPercentaged[];
};
