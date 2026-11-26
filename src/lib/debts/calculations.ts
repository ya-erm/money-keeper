import type {
  Category,
  DebtContact,
  DebtRecord,
  DebtShare,
  Transaction,
  TransactionViewModel,
} from '../data/interfaces';

export function currencyPrecision(currency: string): number {
  // Some CLDR versions format RSD as whole dinars. Accounting still uses 100 para.
  if (currency.toUpperCase() === 'RSD') return 2;
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export const toMinor = (amount: number, currency: string) => Math.round(amount * 10 ** currencyPrecision(currency));
export const fromMinor = (amount: number, currency: string) => amount / 10 ** currencyPrecision(currency);

export function isValidMoney(amount: number, currency: string): boolean {
  const minor = toMinor(amount, currency);
  return Number.isFinite(amount) && Number.isSafeInteger(minor) && Math.abs(fromMinor(minor, currency) - amount) < 1e-8;
}

export function debtTotal(shares: DebtShare[], currency: string): number {
  return fromMinor(
    shares.reduce((sum, share) => sum + toMinor(share.amount, currency), 0),
    currency,
  );
}

type DebtPayment = Pick<Transaction, 'amount' | 'debt' | 'anotherCurrency' | 'anotherCurrencyAmount'>;

/** Use only the exchange amounts recorded on this payment, never a live exchange rate. */
export function shareInAccountCurrency(share: DebtShare, transaction: DebtPayment, currency: string): number | null {
  const shareCurrency = share.currency ?? currency;
  if (shareCurrency === currency) return share.amount;
  if (
    shareCurrency === transaction.anotherCurrency &&
    typeof transaction.anotherCurrencyAmount === 'number' &&
    Number.isFinite(transaction.anotherCurrencyAmount) &&
    transaction.anotherCurrencyAmount > 0
  )
    return (share.amount * transaction.amount) / transaction.anotherCurrencyAmount;
  return null;
}

export function automaticPersonalAmount(transaction: DebtPayment, currency: string): number | null {
  let allocated = 0;
  for (const share of transaction.debt?.shares ?? []) {
    const converted = shareInAccountCurrency(share, transaction, currency);
    if (converted === null) return null;
    allocated += converted;
  }
  return fromMinor(toMinor(transaction.amount, currency) - toMinor(allocated, currency), currency);
}

/** Cash balances use amount. Personal income/expense analytics use this projection. */
export function personalAmount(transaction: DebtPayment & { account: { currency: string } }): number {
  if (!transaction.debt) return transaction.amount;
  return Math.max(
    0,
    transaction.debt.personalAmount ??
      automaticPersonalAmount(transaction, transaction.account.currency) ??
      transaction.amount,
  );
}

export type DebtValidationError =
  'invalid' | 'too_much' | 'duplicate' | 'contact_required' | 'personal_required' | 'invalid_personal';

export function validateDebt(
  transaction: Transaction,
  currency: string,
  direction: 'IN' | 'OUT',
  contacts: DebtContact[],
): DebtValidationError | null {
  if (!transaction.debt) return null;
  const { shares, kind, personalAmount: manualAmount } = transaction.debt;
  if (
    transaction.linkedTransactionId ||
    (kind === 'expense' && direction !== 'OUT') ||
    !['expense', 'loan', 'repayment', 'payment'].includes(kind) ||
    !shares.length ||
    !isValidMoney(transaction.amount, currency) ||
    transaction.amount <= 0
  )
    return 'invalid';
  const ids = new Set<string>();
  let sum = 0;
  for (const share of shares) {
    if (!contacts.some((contact) => contact.id === share.contactId && !contact.deleted)) return 'contact_required';
    if (ids.has(share.contactId)) return 'duplicate';
    ids.add(share.contactId);
    const shareCurrency = share.currency ?? currency;
    if (!/^[A-Z]{3}$/.test(shareCurrency) || !isValidMoney(share.amount, shareCurrency) || share.amount <= 0)
      return 'invalid';
    sum += shareInAccountCurrency(share, transaction, currency) ?? 0;
  }
  if (manualAmount !== undefined) {
    if (
      !isValidMoney(manualAmount, currency) ||
      manualAmount < 0 ||
      toMinor(manualAmount, currency) > toMinor(transaction.amount, currency)
    )
      return 'invalid_personal';
  } else if (automaticPersonalAmount(transaction, currency) === null) return 'personal_required';
  return toMinor(sum, currency) > toMinor(transaction.amount, currency) ? 'too_much' : null;
}

export type DebtEntry = {
  id: string;
  contactId: string;
  amount: number;
  currency: string;
  date: string;
  comment?: string | null;
  dueDate?: string;
  kind: 'expense' | 'loan' | 'repayment' | 'payment' | 'record';
  operationId?: string;
  accountId?: string;
  accountName?: string;
  category?: Category;
};

export function debtEntries(operations: TransactionViewModel[], records: DebtRecord[], now = new Date()): DebtEntry[] {
  const entries: DebtEntry[] = records
    .filter((record) => !record.deleted)
    .map((record) => ({
      ...record,
      kind: record.kind === 'repayment' ? 'repayment' : 'record',
    }));
  for (const operation of operations) {
    if (operation.deleted || !operation.debt || operation.linkedTransactionId) continue;
    for (const share of operation.debt.shares) {
      entries.push({
        id: `${operation.id}:${share.contactId}`,
        contactId: share.contactId,
        amount: share.amount * (operation.category.type === 'OUT' ? 1 : -1),
        currency: share.currency ?? operation.account.currency,
        date: operation.date,
        comment: operation.comment,
        dueDate: operation.debt.dueDate,
        kind: operation.debt.kind,
        operationId: operation.id,
        accountId: operation.accountId,
        accountName: operation.account.name,
        category: operation.category,
      });
    }
  }
  return entries
    .filter((entry) => Number.isFinite(entry.amount) && new Date(entry.date) <= now)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function contactBalances(entries: DebtEntry[], contactId: string): Record<string, number> {
  const sums: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.contactId === contactId)
      sums[entry.currency] = (sums[entry.currency] ?? 0) + toMinor(entry.amount, entry.currency);
  }
  return Object.fromEntries(Object.entries(sums).map(([currency, amount]) => [currency, fromMinor(amount, currency)]));
}

export function recentContacts(contacts: DebtContact[], entries: DebtEntry[], query = '', limit = 5): DebtContact[] {
  const last = new Map<string, number>();
  for (const entry of entries)
    if (Date.parse(entry.date) > (last.get(entry.contactId) ?? 0)) last.set(entry.contactId, Date.parse(entry.date));
  const search = query.trim().toLocaleLowerCase();
  return contacts
    .filter(
      (contact) =>
        !contact.archived && !contact.deleted && (!search || contact.name.toLocaleLowerCase().includes(search)),
    )
    .sort(
      (a, b) =>
        (last.get(b.id) ?? (Date.parse(b.createdAt ?? '') || 0)) -
          (last.get(a.id) ?? (Date.parse(a.createdAt ?? '') || 0)) || a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}
