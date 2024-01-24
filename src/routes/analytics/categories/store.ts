import type { DateIntervalType } from '$lib/interfaces';
import { storable } from '$lib/storable';

export const intervalTypeStore = storable<DateIntervalType>('month', 'intervalType');

export const intervalStartStore = storable<string | null>(null, 'intervalStart');
export const intervalEndStore = storable<string | null>(null, 'intervalEnd');
