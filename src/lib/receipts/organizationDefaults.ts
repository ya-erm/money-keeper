import type { Category, CategoryType, TransactionViewModel } from '#lib/data/interfaces.js';
import type { ReceiptDetails } from './serbianReceipt';

/** Keep the receipt's organization name, independently of the branch and the user's comment. */
export function getReceiptOrganizationName(details?: ReceiptDetails): string | undefined {
  return details?.merchant.trim() || undefined;
}

/** Do not strip punctuation, accents or legal suffixes: these may distinguish organizations. */
export function normalizeReceiptOrganizationName(name?: string | null): string {
  return typeof name === 'string' ? name.trim().replace(/\s+/gu, ' ').toLowerCase() : '';
}

/**
 * Operations must come from the selected workspace's operations store. The most recent operation
 * (by transaction date, with id as a stable tie-breaker) supplies both defaults. A removed category
 * must not prevent reusing its comment or cause an older operation's category to be silently chosen.
 */
export function findReceiptOrganizationDefaults(
  organizationName: string | undefined,
  type: CategoryType,
  operations: readonly TransactionViewModel[],
  categories: readonly Category[],
  excludedId?: string,
): { comment: string; categoryId: string | null } | undefined {
  const name = normalizeReceiptOrganizationName(organizationName);
  if (!name) return;

  let latest: TransactionViewModel | undefined;
  let latestTime = -Infinity;
  for (const operation of operations) {
    if (
      operation.id === excludedId ||
      operation.deleted ||
      operation.linkedTransactionId ||
      operation.category.system ||
      operation.category.type !== type ||
      normalizeReceiptOrganizationName(operation.receiptOrganizationName) !== name
    ) {
      continue;
    }
    const time = Date.parse(operation.date);
    if (!Number.isFinite(time)) continue;
    if (!latest || time > latestTime || (time === latestTime && operation.id > latest.id)) {
      latest = operation;
      latestTime = time;
    }
  }
  if (!latest) return;

  const category = categories.find(
    (category) => category.id === latest.categoryId && category.type === type && !category.deleted && !category.system,
  );
  return { comment: latest.comment ?? '', categoryId: category?.id ?? null };
}
