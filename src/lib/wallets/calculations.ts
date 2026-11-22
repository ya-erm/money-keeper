import type {
  Account,
  Category,
  Transaction,
  VirtualWallet,
  WalletAllocation,
  WalletTransfer,
} from '../data/interfaces';
import { fromMinor, isValidMoney, toMinor } from '../debts/calculations';

export function orderedItems<T extends { id: string }>(items: T[], order: string[] = []): T[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...items].sort((a, b) => (rank.get(a.id) ?? order.length) - (rank.get(b.id) ?? order.length));
}

export function validateAllocation(
  allocation: WalletAllocation | undefined,
  amount: number,
  currency: string,
  wallets: VirtualWallet[],
): boolean {
  if (!allocation) return true;
  if (!allocation.shares.length || !isValidMoney(amount, currency) || amount <= 0) return false;
  const used = new Set<string>();
  let total = 0;
  for (const share of allocation.shares) {
    if (
      used.has(share.walletId) ||
      !wallets.some((w) => w.id === share.walletId && !w.deleted) ||
      !isValidMoney(share.amount, currency) ||
      share.amount < 0
    )
      return false;
    used.add(share.walletId);
    total += toMinor(share.amount, currency);
  }
  return total === toMinor(amount, currency);
}

export function splitEqually(amount: number, count: number, currency: string): number[] {
  if (!count || !Number.isFinite(amount) || amount < 0) return [];
  const total = toMinor(amount, currency);
  return Array.from({ length: count }, (_, i) =>
    fromMinor(Math.floor(total / count) + (i < total % count ? 1 : 0), currency),
  );
}

export function validateWalletTransfer(transfer: WalletTransfer, wallets: VirtualWallet[]): boolean {
  if (
    !/^[A-Z]{3}$/.test(transfer.currency) ||
    !isValidMoney(transfer.amount, transfer.currency) ||
    transfer.amount <= 0 ||
    !Number.isFinite(Date.parse(transfer.date)) ||
    transfer.fromWalletId === transfer.toWalletId
  )
    return false;
  return [transfer.fromWalletId, transfer.toWalletId].every(
    (id) => !id || wallets.some((wallet) => wallet.id === id && !wallet.deleted),
  );
}

export type WalletEntry = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  operation?: Transaction;
  transfer?: WalletTransfer;
};

export function walletEntries(
  wallet: VirtualWallet,
  operations: Transaction[],
  categories: Category[],
  accounts: Account[],
  transfers: WalletTransfer[],
  now = new Date(),
): WalletEntry[] {
  const directions = new Map(categories.map((category) => [category.id, category.type]));
  const currencies = new Map(accounts.map((account) => [account.id, account.currency]));
  const entries: WalletEntry[] = [];
  for (const operation of operations) {
    if (operation.deleted || !Number.isFinite(Date.parse(operation.date)) || Date.parse(operation.date) > now.getTime())
      continue;
    const share = operation.walletAllocation?.shares.find((share) => share.walletId === wallet.id);
    const direction = directions.get(operation.categoryId);
    const currency = currencies.get(operation.accountId);
    if (share && direction && currency)
      entries.push({
        id: operation.id,
        date: operation.date,
        currency,
        amount: share.amount * (direction === 'IN' ? 1 : -1),
        operation,
      });
  }
  for (const transfer of transfers) {
    if (transfer.deleted || !Number.isFinite(Date.parse(transfer.date)) || Date.parse(transfer.date) > now.getTime())
      continue;
    if (transfer.toWalletId === wallet.id || transfer.fromWalletId === wallet.id)
      entries.push({
        id: transfer.id,
        date: transfer.date,
        currency: transfer.currency,
        amount: transfer.amount * (transfer.toWalletId === wallet.id ? 1 : -1),
        transfer,
      });
  }
  return entries.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/** Allocate received currency by the source shares, with deterministic minor-unit rounding. */
export function convertAllocation(
  allocation: WalletAllocation | undefined,
  sourceAmount: number,
  destinationAmount: number,
  currency: string,
): WalletAllocation | undefined {
  if (
    !allocation ||
    sourceAmount <= 0 ||
    destinationAmount <= 0 ||
    !Number.isFinite(sourceAmount) ||
    !Number.isFinite(destinationAmount)
  )
    return undefined;
  const total = toMinor(destinationAmount, currency);
  const sourceTotal = allocation.shares.reduce((sum, share) => sum + share.amount, 0);
  if (Math.abs(sourceTotal - sourceAmount) > 1e-7) return undefined;
  const raw = allocation.shares.map((share) => (total * share.amount) / sourceAmount);
  const minor = raw.map(Math.floor);
  const remainder = total - minor.reduce((sum, amount) => sum + amount, 0);
  const rank = raw
    .map((value, index) => ({ index, fraction: value - minor[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < remainder; i++) minor[rank[i % rank.length].index]++;
  return {
    shares: allocation.shares.map((share, i) => ({ walletId: share.walletId, amount: fromMinor(minor[i], currency) })),
  };
}

export function walletBalance(entries: WalletEntry[], currency: string): number {
  return fromMinor(
    entries
      .filter((entry) => entry.currency === currency)
      .reduce((sum, entry) => sum + toMinor(entry.amount, currency), 0),
    currency,
  );
}

/** Gross contributions and returns remain separate from spending by the shared wallet. */
export function walletContributions(
  wallet: VirtualWallet,
  transfers: WalletTransfer[],
  currency: string,
  now = new Date(),
) {
  const amounts = new Map<string, { contributed: number; returned: number }>();
  for (const transfer of transfers) {
    if (
      transfer.deleted ||
      transfer.currency !== currency ||
      !transfer.contributorParticipantId ||
      !Number.isFinite(Date.parse(transfer.date)) ||
      Date.parse(transfer.date) > now.getTime()
    )
      continue;
    const incoming = transfer.toWalletId === wallet.id;
    const outgoing = transfer.fromWalletId === wallet.id;
    if (!incoming && !outgoing) continue;
    const value = amounts.get(transfer.contributorParticipantId) ?? { contributed: 0, returned: 0 };
    value[incoming ? 'contributed' : 'returned'] += toMinor(transfer.amount, currency);
    amounts.set(transfer.contributorParticipantId, value);
  }
  return Array.from(amounts, ([participantId, value]) => ({
    participantId,
    contributed: fromMinor(value.contributed, currency),
    returned: fromMinor(value.returned, currency),
  }));
}

/** Wallet shares of daily spending, excluding internal/bank transfers and analytics exclusions. */
export function walletDayExpenses(
  entries: WalletEntry[],
  categories: Category[],
): { currency: string; amount: number }[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const operation = entry.operation;
    const category = operation && byId.get(operation.categoryId);
    if (
      !operation ||
      category?.type !== 'OUT' ||
      category.system ||
      operation.linkedTransactionId ||
      operation.excludeFromAnalysis
    )
      continue;
    totals.set(entry.currency, (totals.get(entry.currency) ?? 0) + toMinor(Math.abs(entry.amount), entry.currency));
  }
  return [...totals].map(([currency, amount]) => ({ currency, amount: fromMinor(amount, currency) }));
}
