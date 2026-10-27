import { storable } from '#lib/storable.js';
import type { LocalBalanceVisibility } from '#lib/utils/isBalanceHidden.js';

// Keep the existing key so choices made before this preference became app-wide still apply.
export const localAccountBalancesHidden = storable<LocalBalanceVisibility>({}, 'cardBalancesHidden');
