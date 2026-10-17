import { storable } from '$lib/storable';

export const cardBalancesHidden = storable<Record<string, boolean>>({}, 'cardBalancesHidden');
