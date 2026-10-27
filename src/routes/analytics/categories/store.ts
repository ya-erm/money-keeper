import type { DateIntervalType } from '#lib/data/interfaces.js';
import { storable } from '#lib/storable.js';

export const intervalTypeStore = storable<DateIntervalType>('month', 'intervalType');

export const intervalStartStore = storable<string | null>(null, 'intervalStart');
export const intervalEndStore = storable<string | null>(null, 'intervalEnd');
