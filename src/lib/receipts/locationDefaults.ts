import type { Transaction } from '#lib/data/interfaces.js';
import { isValidCoordinates, type Coordinates } from '#lib/utils/geolocation.js';
import type { ReceiptDetails } from './serbianReceipt';

/** Keep the city with the street address so branches in different towns do not share a location. */
export function getReceiptAddress(details?: ReceiptDetails): string | undefined {
  const address = details?.address.trim();
  if (!address) return;
  return [address, details?.city.trim()].filter(Boolean).join(', ');
}

/** Preserve accents, punctuation and building numbers; only ignore case and whitespace. */
export function normalizeReceiptAddress(address?: string | null): string {
  return typeof address === 'string' ? address.trim().replace(/\s+/gu, ' ').toLowerCase() : '';
}

/** Only pass operations from the selected workspace. Refunds and expenses can share a store location. */
export function findReceiptLocation(
  receiptAddress: string | undefined,
  operations: readonly Transaction[],
  excludedId?: string,
): Coordinates | undefined {
  const address = normalizeReceiptAddress(receiptAddress);
  if (!address) return;

  let latest: Transaction | undefined;
  let latestTime = -Infinity;
  for (const operation of operations) {
    if (
      operation.id === excludedId ||
      operation.deleted ||
      operation.linkedTransactionId ||
      !operation.receiptUrl?.trim() ||
      normalizeReceiptAddress(operation.receiptAddress) !== address ||
      typeof operation.locationLat !== 'number' ||
      typeof operation.locationLng !== 'number' ||
      !isValidCoordinates(operation.locationLat, operation.locationLng)
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
  if (latest) return { latitude: latest.locationLat!, longitude: latest.locationLng! };
}
