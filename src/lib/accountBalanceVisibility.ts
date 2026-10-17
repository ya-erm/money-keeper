import { storable } from '$lib/storable';
import type { LocalBalanceVisibility } from '$lib/utils/isBalanceHidden';

// Keep the existing key so choices made before this preference became app-wide still apply.
export const localAccountBalancesHidden = storable<LocalBalanceVisibility>({}, 'cardBalancesHidden');
