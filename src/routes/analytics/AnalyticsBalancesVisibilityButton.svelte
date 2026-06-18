<script lang="ts">
  import { accountsStore, settingsStore } from '$lib/data';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';
  import { translate } from '$lib/translate';
  import { hasHiddenBalanceAccount } from '$lib/utils';
  import { hideVisibleAnalyticsBalances, showHiddenAnalyticsBalances } from './store';

  export let triState = false;

  $: hasHiddenBalances = hasHiddenBalanceAccount($settingsStore, $accountsStore);
  $: hasPartiallyHiddenBalances =
    triState && !$settingsStore.hideBalances && $accountsStore.some((account) => account.hideBalance);
  $: if (hasHiddenBalances && !hasPartiallyHiddenBalances && $hideVisibleAnalyticsBalances) {
    hideVisibleAnalyticsBalances.set(false);
  }
  $: if (!hasHiddenBalances && $showHiddenAnalyticsBalances) {
    showHiddenAnalyticsBalances.set(false);
  }

  $: isPartiallyHidden = hasPartiallyHiddenBalances && !$showHiddenAnalyticsBalances && !$hideVisibleAnalyticsBalances;

  $: icon = isPartiallyHidden
    ? 'mdi:eye-lock-outline'
    : hasHiddenBalances
      ? $showHiddenAnalyticsBalances
        ? 'mdi:eye-outline'
        : 'mdi:eye-off-outline'
      : $hideVisibleAnalyticsBalances
        ? 'mdi:eye-off-outline'
        : 'mdi:eye-outline';

  $: label =
    isPartiallyHidden || (hasHiddenBalances && !$showHiddenAnalyticsBalances)
      ? $translate('privacy.show_balances')
      : $translate($hideVisibleAnalyticsBalances ? 'privacy.show_balances' : 'privacy.hide_balances');

  const handleClick = () => {
    if (hasHiddenBalances) {
      if (hasPartiallyHiddenBalances) {
        if (!$showHiddenAnalyticsBalances && !$hideVisibleAnalyticsBalances) {
          hideVisibleAnalyticsBalances.set(true);
        } else if ($hideVisibleAnalyticsBalances) {
          hideVisibleAnalyticsBalances.set(false);
          showHiddenAnalyticsBalances.set(true);
        } else {
          showHiddenAnalyticsBalances.set(false);
        }
      } else {
        hideVisibleAnalyticsBalances.set(false);
        showHiddenAnalyticsBalances.update((value) => !value);
      }
      return;
    }

    showHiddenAnalyticsBalances.set(false);
    hideVisibleAnalyticsBalances.update((value) => !value);
  };
</script>

<HeaderButton {icon} {label} onClick={handleClick} />
