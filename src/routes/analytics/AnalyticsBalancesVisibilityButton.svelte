<script lang="ts">
  import { accountsStore, settingsStore } from '$lib/data';
  import HeaderButton from '$lib/ui/layout/HeaderButton.svelte';
  import { translate } from '$lib/translate';
  import { hasHiddenBalanceAccount } from '$lib/utils';
  import { analyticsBalancesVisibilityMode } from './store';

  export let triState = false;

  $: hasHiddenBalances = hasHiddenBalanceAccount($settingsStore, $accountsStore);
  $: hasPartiallyHiddenBalances =
    triState && !$settingsStore.hideBalances && $accountsStore.some((account) => account.hideBalance);

  $: if (!hasHiddenBalances && $analyticsBalancesVisibilityMode === 'show') {
    analyticsBalancesVisibilityMode.set('auto');
  }
  $: if (hasHiddenBalances && !hasPartiallyHiddenBalances && $analyticsBalancesVisibilityMode === 'hide') {
    analyticsBalancesVisibilityMode.set('auto');
  }

  $: isPartiallyHidden = hasPartiallyHiddenBalances && $analyticsBalancesVisibilityMode === 'auto';

  $: icon = isPartiallyHidden
    ? 'mdi:eye-lock-outline'
    : hasHiddenBalances
      ? $analyticsBalancesVisibilityMode === 'show'
        ? 'mdi:eye-outline'
        : 'mdi:eye-off-outline'
      : $analyticsBalancesVisibilityMode === 'hide'
        ? 'mdi:eye-off-outline'
        : 'mdi:eye-outline';

  $: label =
    isPartiallyHidden || (hasHiddenBalances && $analyticsBalancesVisibilityMode !== 'show')
      ? $translate('privacy.show_balances')
      : $translate($analyticsBalancesVisibilityMode === 'hide' ? 'privacy.show_balances' : 'privacy.hide_balances');

  const handleClick = () => {
    if (hasHiddenBalances) {
      if (hasPartiallyHiddenBalances) {
        if ($analyticsBalancesVisibilityMode === 'auto') {
          analyticsBalancesVisibilityMode.set('hide');
        } else if ($analyticsBalancesVisibilityMode === 'hide') {
          analyticsBalancesVisibilityMode.set('show');
        } else {
          analyticsBalancesVisibilityMode.set('auto');
        }
      } else {
        analyticsBalancesVisibilityMode.update((value) => (value === 'show' ? 'auto' : 'show'));
      }
      return;
    }

    analyticsBalancesVisibilityMode.update((value) => (value === 'hide' ? 'auto' : 'hide'));
  };
</script>

<HeaderButton {icon} {label} onClick={handleClick} />
