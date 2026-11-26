<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import dayjs from 'dayjs';
  import { v4 as uuid } from 'uuid';
  import { page } from '#lib/page.js';

  import Button from '@ya-erm/svelte-ui/Button';
  import Checkbox from '@ya-erm/svelte-ui/Checkbox';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import SpoilerToggle from '@ya-erm/svelte-ui/SpoilerToggle';

  import { membersService, memberSettingsStore, operationTagsService } from '#lib/data/index.js';
  import {
    SYSTEM_CATEGORY_TRANSFER_IN,
    SYSTEM_CATEGORY_TRANSFER_OUT,
    SYSTEM_CATEGORY_DEBT_IN,
    SYSTEM_CATEGORY_DEBT_OUT,
  } from '#lib/data/categories.js';
  import type {
    AccountViewModel,
    Category,
    KnownPlace,
    Tag,
    Transaction,
    TransactionViewModel,
    VerificationStatus,
    TransactionDebt,
  } from '#lib/data/interfaces.js';
  import { operationsCommentsStore, operationsStore } from '#lib/data/operations.js';
  import { debtContactsStore } from '#lib/data/debtContacts.js';
  import { personalAmount, validateDebt } from '#lib/debts/calculations.js';
  import DebtAllocationEditor from '#lib/debts/DebtAllocationEditor.svelte';
  import { withVerification } from '#lib/data/verification.js';
  import { repeatingsService, repeatingsStore } from '#lib/data/repeatings.js';
  import { translate } from '#lib/translate/index.js';
  import { route } from '#lib/routes.js';
  import type { Messages } from '#lib/translate/messages.js';
  import SubScreen from '#lib/ui/layout/SubScreen.svelte';
  import { showErrorToast } from '@ya-erm/svelte-ui/toasts';
  import { formatMoney, getSearchParam, getTimeZoneOffset, handleError } from '#lib/utils/index.js';
  import { replaceCalcExpressions } from '#lib/utils/calc.js';
  import {
    checkNumberFormParameter,
    checkStringFormParameter,
    checkStringOptionalFormParameter,
  } from '#lib/utils/checkFormParams.js';
  import TagsList from '#lib/widgets/TagsList.svelte';
  import TimeZoneList from '#lib/widgets/TimeZoneList.svelte';
  import PlaceSelector from '#lib/widgets/PlaceSelector.svelte';
  import LocationPicker from '#lib/widgets/LocationPicker.svelte';
  import { findNearbyPlaces, isValidCoordinates, type Coordinates } from '#lib/utils/geolocation.js';
  import ReceiptScanner from '#lib/receipts/ReceiptScanner.svelte';
  import type { SerbianReceipt } from '#lib/receipts/serbianReceipt.js';
  import PurchaseItemsEditor from '#lib/receipts/PurchaseItemsEditor.svelte';
  import { toPurchaseItems, type PurchaseItemDraft } from '#lib/receipts/purchaseItems.js';
  import { findReceiptOrganizationDefaults, getReceiptOrganizationName } from '#lib/receipts/organizationDefaults.js';
  import { findReceiptLocation, getReceiptAddress } from '#lib/receipts/locationDefaults.js';

  import RepeatingModal from '../../repeatings/RepeatingModal.svelte';
  import RepeatingsList from '../../repeatings/RepeatingsList.svelte';
  import AccountSelector from './AccountSelector.svelte';
  import AnotherCurrencyModal from './AnotherCurrencyModal.svelte';
  import CategorySelect from './CategorySelect.svelte';
  import RepeatingTypeModal from './RepeatingTypeModal.svelte';
  import TypeSwitch from './TypeSwitch.svelte';
  import AllocationEditor from '#lib/wallets/AllocationEditor.svelte';
  import { convertAllocation, validateAllocation, nonzeroAllocation } from '#lib/wallets/calculations.js';
  import { walletsService } from '#lib/data/wallets.js';
  import { selectedParticipantStore } from '#lib/data/participants.js';
  import type { WalletAllocation } from '#lib/data/interfaces.js';

  $: settings = $memberSettingsStore;

  export let accounts: AccountViewModel[];
  export let categories: Category[];
  export let tags: Tag[];

  export let transaction: TransactionViewModel | null = null;

  export let onSubmit: (transactions: Transaction[]) => void | Promise<void>;
  let saving = false;
  const savedTransactionId = transaction?.id ?? uuid();
  const savedDestinationId = transaction?.linkedTransactionId ?? uuid();

  const isTransfer = !!transaction?.linkedTransactionId;
  const sourceTransaction =
    isTransfer && transaction?.category.type === 'OUT' ? transaction : transaction?.linkedTransaction;
  const destinationTransaction =
    isTransfer && transaction?.category.type === 'IN' ? transaction : transaction?.linkedTransaction;

  let type = isTransfer
    ? 'TRANSFER'
    : transaction
      ? transaction.category.type
      : (getSearchParam($page, 'type') ?? 'OUT');

  let categoryId = transaction?.categoryId ?? getSearchParam($page, 'categoryId');

  let timeZone = transaction ? (transaction?.timeZone ?? undefined) : dayjs.tz.guess();
  let timeZoneShift = timeZone ? getTimeZoneOffset(timeZone) : undefined;
  let timeZoneListVisible = false;

  let date = dayjs(transaction?.date).tz(timeZone).format('YYYY-MM-DD');
  let time = dayjs(transaction?.date).tz(timeZone).format('HH:mm');
  $: datetime = timeZone ? dayjs.tz(`${date} ${time}`, timeZone).format() : dayjs(`${date} ${time}`).tz('UTC').format();

  let inputRef: HTMLInputElement | null = null;

  let accountId = isTransfer
    ? sourceTransaction?.accountId
    : (transaction?.accountId ?? getSearchParam($page, 'accountId'));
  let destinationAccountId = isTransfer
    ? destinationTransaction?.accountId
    : getSearchParam($page, 'destinationAccountId');

  $: accountCurrency = accounts.find(({ id }) => id === accountId)?.currency;
  $: destinationAccountCurrency = accounts.find(({ id }) => id === destinationAccountId)?.currency;

  let destinationAmountTouched = false;
  let walletAllocation: WalletAllocation | undefined = structuredClone(
    (isTransfer ? sourceTransaction : transaction)?.walletAllocation,
  );
  let destinationWalletAllocation: WalletAllocation | undefined = structuredClone(
    destinationTransaction?.walletAllocation,
  );
  let automaticDestinationAllocation = !transaction;
  $: if (type === 'TRANSFER' && automaticDestinationAllocation) {
    destinationWalletAllocation = convertAllocation(
      walletAllocation,
      Number(_value1),
      Number(_value2),
      destinationAccountCurrency ?? 'EUR',
    );
  }
  $: if (!transaction && !accountId && $selectedParticipantStore) {
    accountId = accounts.find((account) => !account.archived)?.id;
  }

  let _value1 = (isTransfer ? sourceTransaction?.amount : transaction?.amount)?.toString() ?? '';
  let _value2 = destinationTransaction?.amount?.toString() ?? transaction?.anotherCurrencyAmount?.toString() ?? '';
  $: _rate = Number(_value1) / Number(_value2);

  let selectingAccount = false;
  let selectingDestinationAccount = false;

  let selectedTags = transaction?.tags.map((t) => `${t.id}`) ?? [];

  let comment = transaction?.comment ?? '';
  // Protect explicit edits, including clearing a field, from later/repeated receipt reads.
  let commentTouched = !!transaction || !!comment;
  let categoryTouched = !!transaction || !!categoryId;

  let locationLat = transaction?.locationLat ?? null;
  let locationLng = transaction?.locationLng ?? null;
  // Existing operations and explicit choices (including clearing) retain their location on rescans.
  let locationTouched = !!transaction;
  let receiptLocationApplied = false;
  let editorPlace: KnownPlace | null = null;
  let locationPickerOpened = false;
  let selectedKnownPlaceId = '';
  let currentPosition: Coordinates | null = null;
  let locating = false;
  let disposed = false;
  let locationRevision = 0;

  $: knownPlaces = settings?.knownPlaces ?? [];
  $: hasLocation = locationLat !== null && locationLng !== null;
  $: nearbyPlaces = findNearbyPlaces(currentPosition, knownPlaces);
  $: selectedKnownPlace = knownPlaces.find((place) => place.id === selectedKnownPlaceId) ?? null;
  $: if (!selectedKnownPlaceId && locationLat !== null && locationLng !== null) {
    selectedKnownPlaceId =
      findNearbyPlaces({ latitude: locationLat, longitude: locationLng }, knownPlaces)[0]?.id ?? '';
  }

  onMount(() => {
    const suggestNearbyPlaces = async () => {
      try {
        if (!navigator.geolocation || !navigator.permissions) return;
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (disposed || permission.state !== 'granted') return;
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (!disposed) currentPosition = { latitude: coords.latitude, longitude: coords.longitude };
          },
          () => {},
          { timeout: 10000, maximumAge: 60000 },
        );
      } catch {
        // Browsers without a geolocation Permissions API can still use the GPS button.
      }
    };
    if (!transaction && membersService.selectedMemberSettings?.autoDetectLocation && !hasLocation) {
      detectLocation(true);
    } else {
      void suggestNearbyPlaces();
    }
    return () => {
      disposed = true;
    };
  });

  let anotherCurrencyModalOpened = false;
  let anotherCurrency: string | null = transaction?.anotherCurrency ?? null;
  let receiptScannerOpened = !transaction && getSearchParam($page, 'scan-receipt') === '1';
  afterNavigate(({ from, to }) => {
    // A new entry from the accounts screen requests another scan, even if navigation
    // restores this form. Same-page changes (such as the operation type) do not.
    if (
      !transaction &&
      to?.url.pathname === route('transactions.create') &&
      to.url.searchParams.get('scan-receipt') === '1' &&
      from?.url.pathname !== to.url.pathname
    ) {
      receiptScannerOpened = true;
    }
  });
  let pendingReceiptAmount: number | null = null;

  // A receipt may be scanned before the user chooses an account.
  const resolveReceiptCurrency = (amount: number, currency: string) => {
    pendingReceiptAmount = null;
    if (currency.toUpperCase() === 'RSD') {
      _value1 = amount.toString();
      _value2 = '';
      anotherCurrency = null;
    }
  };
  $: if (pendingReceiptAmount !== null && accountCurrency) {
    resolveReceiptCurrency(pendingReceiptAmount, accountCurrency);
  }

  const applyReceipt = (receipt: SerbianReceipt) => {
    // A manual/preselected category only survives if it is valid for this receipt's direction.
    if (
      categoryId &&
      !categories.some(
        (category) =>
          category.id === categoryId && category.type === receipt.type && !category.deleted && !category.system,
      )
    ) {
      categoryId = null;
      categoryTouched = false;
    }
    type = receipt.type;
    timeZone = 'Europe/Belgrade';
    timeZoneShift = getTimeZoneOffset(timeZone);
    date = dayjs(receipt.date).tz(timeZone).format('YYYY-MM-DD');
    time = dayjs(receipt.date).tz(timeZone).format('HH:mm');
    if (accountCurrency?.toUpperCase() === 'RSD') {
      _value1 = receipt.amount.toString();
      _value2 = '';
      anotherCurrency = null;
    } else {
      // Keep the receipt amount in RSD; the account debit is entered by the user.
      _value1 = '';
      _value2 = receipt.amount.toString();
      anotherCurrency = 'RSD';
    }
    pendingReceiptAmount = accountCurrency ? null : receipt.amount;
    receiptOrganizationName = getReceiptOrganizationName(receipt.details);
    const defaults = findReceiptOrganizationDefaults(
      receiptOrganizationName,
      receipt.type,
      $operationsStore,
      categories,
      transaction?.id,
    );
    if (!commentTouched) comment = defaults?.comment ?? receiptOrganizationName ?? '';
    if (!categoryTouched) categoryId = defaults?.categoryId ?? null;
    receiptAddress = getReceiptAddress(receipt.details);
    if (!locationTouched) {
      const position = findReceiptLocation(receiptAddress, $operationsStore, transaction?.id);
      // Discard an earlier receipt's suggestion when a different branch has no matching history.
      if (position || receiptLocationApplied) {
        locationRevision++;
        locationLat = position?.latitude ?? null;
        locationLng = position?.longitude ?? null;
        selectedKnownPlaceId = position ? (findNearbyPlaces(position, knownPlaces)[0]?.id ?? '') : '';
        receiptLocationApplied = !!position;
      }
    }
    receiptUrl = receipt.url;
    purchaseItems = receipt.details?.items.map((item) => ({ ...item })) ?? [];
    receiptScannerOpened = false;
  };

  let suggestions: string[] = [];

  const comments = $operationsCommentsStore;

  const handleCommentChange = (value: string) => {
    commentTouched = true;
    comment = value;
    if (comment.length < 2) {
      suggestions = [];
      return;
    }
    const newSuggestions = comments.filter((item) => item.startsWith(comment)).slice(0, 3);
    if (newSuggestions.length === 1 && newSuggestions[0] === comment) {
      suggestions = [];
      return;
    }
    if (newSuggestions.join(',') !== suggestions.join(',')) {
      suggestions = newSuggestions;
    }
  };

  let description = transaction?.description ?? '';
  let receiptUrl = transaction?.receiptUrl ?? '';
  let receiptOrganizationName: string | null | undefined = transaction?.receiptOrganizationName;
  let receiptAddress: string | null | undefined = transaction?.receiptAddress;
  let receiptHref: string | null = null;
  $: {
    try {
      const url = new URL(receiptUrl.trim());
      receiptHref = ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      receiptHref = null;
    }
  }
  let purchaseItems: PurchaseItemDraft[] = transaction?.purchaseItems?.map((item) => ({ ...item })) ?? [];
  let purchaseContentsHidden = true;
  const verification = transaction?.verification ?? null;

  const verificationMessage = (status: VerificationStatus): Messages => `transactions.verification.${status}`;

  let additionalParametersHidden =
    transaction?.debt ||
    transaction?.excludeFromAnalysis ||
    transaction?.repeating ||
    transaction?.description ||
    verification
      ? false
      : true;

  let excludeFromAnalysis = transaction?.excludeFromAnalysis ?? false;
  let debt: TransactionDebt | undefined = transaction?.debt ? structuredClone(transaction.debt) : undefined;
  $: fullyDebtPayment =
    type !== 'TRANSFER' &&
    !!debt?.shares.length &&
    Number(_value1) > 0 &&
    personalAmount({
      amount: Number(_value1),
      debt,
      anotherCurrency,
      anotherCurrencyAmount: Number(_value2),
      account: { currency: accountCurrency ?? '' },
    }) === 0;
  $: defaultDebtCategory = type === 'IN' ? SYSTEM_CATEGORY_DEBT_IN : SYSTEM_CATEGORY_DEBT_OUT;
  $: availableCategories = [
    ...categories.filter((category) => category.type === type && !category.deleted && !category.system),
    ...(fullyDebtPayment ? [{ ...defaultDebtCategory, name: $translate(defaultDebtCategory.name as Messages) }] : []),
  ];
  $: effectiveCategoryId =
    availableCategories.find((category) => category.id === categoryId)?.id ??
    (fullyDebtPayment ? defaultDebtCategory.id : null);
  $: systemDebtCategory = effectiveCategoryId === 'system-debt-in' || effectiveCategoryId === 'system-debt-out';

  let repeating = transaction?.repeating;
  let repeatingChecked = transaction?.repeating ? true : false;
  let repeatingTypeModalOpened = false;
  let repeatingListVisible = false;
  let repeatingModalOpened = false;

  const handleRepeatingCheckboxChange = (checked: boolean) => {
    if (checked && !repeating) {
      repeatingTypeModalOpened = true;
    }
  };

  const openLocationPicker = (adding = false) => {
    locationRevision++;
    editorPlace = adding ? null : selectedKnownPlace;
    locationPickerOpened = true;
  };

  const chooseKnownPlace = (place: KnownPlace | null) => {
    locationTouched = true;
    locationRevision++;
    if (place) {
      locationLat = place.latitude;
      locationLng = place.longitude;
      selectedKnownPlaceId = place.id;
    } else removeLocation();
  };

  const removeLocation = () => {
    locationTouched = true;
    locationRevision++;
    locationLat = null;
    locationLng = null;
    selectedKnownPlaceId = '';
  };

  const detectLocation = (automatic = false) => {
    if (locating) return;
    if (!automatic) {
      locationTouched = true;
      locationRevision++;
    }
    if (!navigator.geolocation) {
      showErrorToast($translate('transactions.geolocation_not_supported'));
      return;
    }
    const revision = locationRevision;
    locating = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (disposed) return;
        locating = false;
        if (!isValidCoordinates(coords.latitude, coords.longitude)) {
          showErrorToast($translate('transactions.geolocation_failed'));
          return;
        }
        const position = { latitude: coords.latitude, longitude: coords.longitude };
        currentPosition = position;
        if (revision !== locationRevision) return;
        const nearest = findNearbyPlaces(position, knownPlaces)[0];
        locationRevision++;
        locationLat = nearest?.latitude ?? position.latitude;
        locationLng = nearest?.longitude ?? position.longitude;
        selectedKnownPlaceId = nearest?.id ?? '';
      },
      () => {
        if (disposed) return;
        locating = false;
        if (revision === locationRevision) showErrorToast($translate('transactions.geolocation_failed'));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onLocationSelected = async (position: Coordinates, name: string) => {
    locationTouched = true;
    locationRevision++;
    let savedPlace: KnownPlace | null = null;
    if (name) {
      const saved: KnownPlace = { id: editorPlace?.id ?? uuid(), name, ...position };
      savedPlace = saved;
      const places = membersService.selectedMemberSettings?.knownPlaces ?? [];
      await membersService.updateKnownPlaces(
        editorPlace ? places.map((place) => (place.id === editorPlace?.id ? saved : place)) : [...places, saved],
      );
    }
    locationLat = position.latitude;
    locationLng = position.longitude;
    selectedKnownPlaceId = savedPlace?.id ?? findNearbyPlaces(position, knownPlaces)[0]?.id ?? '';
    locationPickerOpened = false;
  };

  const removeKnownPlace = async () => {
    if (!editorPlace) return;
    locationTouched = true;
    const placeId = editorPlace.id;
    const places = membersService.selectedMemberSettings?.knownPlaces ?? [];
    await membersService.updateKnownPlaces(places.filter((place) => place.id !== placeId));
    locationRevision++;
    if (selectedKnownPlaceId === placeId) selectedKnownPlaceId = '';
    editorPlace = null;
    locationPickerOpened = false;
  };

  const handleSubmit = async (e: Event) => {
    if (saving) return;
    saving = true;
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      if (!formData.get('accountId') || formData.get('accountId') === 'undefined') {
        showErrorToast($translate('transactions.account_is_required'), { testId: 'AccountIsRequiredErrorToast' });
        return;
      }
      let resolvedCategoryId = formData.get('categoryId') as string | null;
      if (
        (type === 'IN' || type === 'OUT') &&
        !systemDebtCategory &&
        !categories.some((category) => category.id === resolvedCategoryId && category.type === type)
      ) {
        resolvedCategoryId = null;
        categoryId = null;
      }
      if ((type === 'IN' || type === 'OUT') && !resolvedCategoryId) {
        // A receipt match must not fall back to an unrelated operation with the same free-form comment.
        const matchingOperation =
          comment.trim() && !receiptOrganizationName && !receiptUrl.trim()
            ? $operationsStore.find(
                (op) =>
                  op.comment?.trim() === comment.trim() &&
                  categories.some(
                    (category) =>
                      category.id === op.categoryId && category.type === type && !category.deleted && !category.system,
                  ),
              )
            : undefined;
        if (matchingOperation) {
          resolvedCategoryId = matchingOperation.categoryId;
          categoryId = resolvedCategoryId;
        } else {
          showErrorToast($translate('transactions.category_is_required'), { testId: 'CategoryIsRequiredErrorToast' });
          return;
        }
      }
      if (type === 'TRANSFER' && !formData.get('destinationAccountId')) {
        showErrorToast($translate('transactions.destination_account_is_required'), {
          testId: 'DestinationAccountIsRequiredErrorToast',
        });
        return;
      }
      if (type === 'TRANSFER' && formData.get('accountId') === formData.get('destinationAccountId')) {
        showErrorToast($translate('transactions.accounts_must_be_different'), {
          testId: 'AccountsMustBeDifferentErrorToast',
        });
        return;
      }

      const tagIds = selectedTags.filter((tagId) => tags.find((t) => t.id === tagId));

      let savedPurchaseItems;
      try {
        savedPurchaseItems = toPurchaseItems(purchaseItems);
      } catch {
        showErrorToast($translate('receipts.invalid_items'));
        return;
      }
      const transactions: Transaction[] = [];

      transactions.push({
        id: savedTransactionId,
        accountId: checkStringFormParameter(formData, 'accountId'),
        categoryId:
          type === 'TRANSFER'
            ? SYSTEM_CATEGORY_TRANSFER_OUT.id
            : (resolvedCategoryId ?? checkStringFormParameter(formData, 'categoryId')),
        date: datetime,
        ...(timeZone ? { timeZone } : {}),
        amount: checkNumberFormParameter(formData, 'amount'),
        ...(walletAllocation ? { walletAllocation: structuredClone(walletAllocation) } : {}),
        comment: checkStringOptionalFormParameter(formData, 'comment'),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(receiptUrl.trim() ? { receiptUrl: receiptUrl.trim() } : {}),
        ...(receiptOrganizationName ? { receiptOrganizationName } : {}),
        ...(receiptAddress ? { receiptAddress } : {}),
        ...(savedPurchaseItems.length ? { purchaseItems: savedPurchaseItems } : {}),
        tagIds,
        ...(anotherCurrency
          ? {
              anotherCurrency,
              anotherCurrencyAmount: checkNumberFormParameter(formData, 'destinationAmount'),
            }
          : {}),
        ...(excludeFromAnalysis ? { excludeFromAnalysis } : {}),
        ...(repeatingChecked ? { repeatingId: repeating?.id } : {}),
        ...(locationLat !== null && locationLng !== null ? { locationLat, locationLng } : {}),
      });

      if (type === 'TRANSFER') {
        transactions.push({
          id: savedDestinationId,
          accountId: checkStringFormParameter(formData, 'destinationAccountId'),
          categoryId: SYSTEM_CATEGORY_TRANSFER_IN.id,
          date: datetime,
          ...(timeZone ? { timeZone } : {}),
          amount: checkNumberFormParameter(formData, 'destinationAmount'),
          ...(destinationWalletAllocation ? { walletAllocation: structuredClone(destinationWalletAllocation) } : {}),
          comment: checkStringOptionalFormParameter(formData, 'comment')?.trim(),
          ...(destinationTransaction?.description ? { description: destinationTransaction.description } : {}),

          ...(destinationTransaction?.receiptUrl ? { receiptUrl: destinationTransaction.receiptUrl } : {}),

          ...(destinationTransaction?.receiptOrganizationName
            ? { receiptOrganizationName: destinationTransaction.receiptOrganizationName }
            : {}),

          ...(destinationTransaction?.receiptAddress ? { receiptAddress: destinationTransaction.receiptAddress } : {}),

          ...(destinationTransaction?.purchaseItems
            ? {
                purchaseItems: destinationTransaction.purchaseItems.map((item) => ({ ...item })),
              }
            : {}),
          tagIds,
          linkedTransactionId: transactions[0].id,
          ...(excludeFromAnalysis ? { excludeFromAnalysis } : {}),
          ...(repeatingChecked ? { repeatingId: repeating?.id } : {}),
          ...(locationLat !== null && locationLng !== null ? { locationLat, locationLng } : {}),
        });
        transactions[0].linkedTransactionId = transactions[1].id;
      }

      for (const item of transactions) {
        const cleaned = nonzeroAllocation(item.walletAllocation);
        if (cleaned) item.walletAllocation = cleaned;
        else delete item.walletAllocation;
        const currency = accounts.find((account) => account.id === item.accountId)?.currency ?? '';
        if (
          !validateAllocation(item.walletAllocation, item.amount, currency, [
            ...walletsService.items,
            ...walletsService.deletedItems
              .filter((wallet) => transaction?.walletAllocation?.shares.some((share) => share.walletId === wallet.id))
              .map((wallet) => ({ ...wallet, deleted: false })),
          ])
        ) {
          showErrorToast($translate('wallets.invalid'));
          return;
        }
      }

      if (type !== 'TRANSFER' && debt) {
        if (repeatingChecked) {
          showErrorToast($translate('debts.no_repeating'));
          return;
        }
        const saved = transactions[0];
        saved.debt = { ...debt, kind: 'payment' };
        const currency = accountCurrency ?? '';
        const error = validateDebt(saved, currency, type === 'IN' ? 'IN' : 'OUT', $debtContactsStore);
        if (error) {
          showErrorToast($translate(`debts.${error}`));
          return;
        }
        if (systemDebtCategory && personalAmount({ ...saved, account: { currency } }) > 0) {
          showErrorToast($translate('debts.invalid'));
          return;
        }
      }

      if (repeating) {
        await repeatingsService.save(repeating);
      }

      // Keep verification of edited operations if date, amount and account are the same
      const originalTransactions = [isTransfer ? sourceTransaction : transaction, destinationTransaction];
      await onSubmit(transactions.map((item, i) => withVerification(originalTransactions[i], item)));
    } catch (e) {
      handleError(e);
    } finally {
      saving = false;
    }
  };
</script>

<form on:submit|preventDefault={handleSubmit} data-testId="TransactionForm">
  <div class="flex-col gap-1 p-1">
    <TypeSwitch bind:type disabled={isTransfer} />
    {#if type === 'OUT'}
      <AccountSelector bind:accountId bind:selecting={selectingAccount} testId="SourceAccountSelect" />
    {/if}
    {#if type === 'TRANSFER'}
      <AccountSelector
        bind:accountId
        bind:selecting={selectingAccount}
        label={$translate('transactions.from')}
        testId="SourceAccountSelect"
      />
      <AccountSelector
        name="destinationAccountId"
        bind:accountId={destinationAccountId}
        bind:selecting={selectingDestinationAccount}
        label={$translate('transactions.to')}
        testId="DestinationAccountSelect"
      />
    {/if}
    {#if type === 'IN' || type === 'OUT'}
      <CategorySelect
        {type}
        categoryId={effectiveCategoryId}
        categories={availableCategories}
        onChange={(value) => {
          categoryId = value;
          categoryTouched = true;
          if (!inputRef?.value) {
            inputRef?.focus({ preventScroll: true });
            inputRef?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />
    {/if}
    {#if type === 'IN'}
      <AccountSelector bind:accountId bind:selecting={selectingAccount} testId="DestinationAccountSelect" />
    {/if}
    <div class="flex-col gap-0.5">
      <div class="flex gap-1 justify-between">
        <span class="flex-shrink-0"><InputLabel text={$translate('transactions.dateTime')} /></span>

        <Button appearance="link" underlined={false} onClick={() => (timeZoneListVisible = true)}>
          {#if timeZone}
            <div class="flex gap-0.25">
              <span class="time-zone text-ellipsis">{timeZone}</span>
              <span class="time-shift">(GMT{timeZoneShift})</span>
            </div>
          {:else}
            {$translate('timezones.select_time_zone')}
          {/if}
        </Button>
      </div>
      <div class="flex gap-1">
        <Input name="date" type="date" bind:value={date} required />
        <Input name="time" type="time" bind:value={time} required />
      </div>
      <input name="datetime" value={datetime} class="hidden" readonly />
    </div>
    <div class="flex-col gap-0.5">
      <div class="flex justify-between">
        <InputLabel text={$translate('transactions.amount')} />
        {#if type !== 'TRANSFER'}
          {#if !anotherCurrency}
            <Button
              appearance="link"
              underlined={false}
              onClick={() => {
                anotherCurrencyModalOpened = true;
                anotherCurrency = settings?.lastAnotherCurrency ?? null;
              }}
            >
              {$translate('transactions.another_currency')}
            </Button>
          {:else}
            <Button appearance="link" underlined={false} onClick={() => (anotherCurrency = null)}
              >{$translate('transactions.same_currency')}</Button
            >
          {/if}
        {/if}
      </div>
      <div class="flex gap-1">
        <Input
          type="number"
          name="amount"
          inputmode="decimal"
          bind:ref={inputRef}
          bind:value={_value1}
          onChange={(value) => {
            if (type === 'TRANSFER' && accountCurrency === destinationAccountCurrency && !destinationAmountTouched) {
              _value2 = value;
            }
          }}
          endText={accountCurrency}
          required
        />
        {#if type === 'TRANSFER' || !!anotherCurrency}
          <Input
            type="number"
            name="destinationAmount"
            inputmode="decimal"
            bind:value={_value2}
            endText={destinationAccountCurrency || anotherCurrency}
            onChange={(value) => {
              destinationAmountTouched = !!value;
            }}
            required
          />
        {/if}
      </div>
      {#if (type === 'TRANSFER' || !!anotherCurrency) && Number(_value1) && Number(_value2)}
        <div class="currency-rate-info">
          {`1 ${accountCurrency} = ${formatMoney(1 / _rate, {
            maxPrecision: 4,
            currency: destinationAccountCurrency || (anotherCurrency ?? undefined),
          })}`}
          {`(1 ${destinationAccountCurrency || anotherCurrency} = ${formatMoney(_rate, {
            maxPrecision: 4,
            currency: accountCurrency,
          })})`}
        </div>
      {/if}
    </div>
    <AllocationEditor
      bind:allocation={walletAllocation}
      currency={accountCurrency ?? 'EUR'}
      amount={Number(_value1)}
      useDefault={!transaction && (!!$selectedParticipantStore || !!getSearchParam($page, 'walletId'))}
      initialWalletId={getSearchParam($page, 'walletId')}
    />
    {#if type === 'TRANSFER'}
      <div class="flex-col gap-0.5">
        <InputLabel text={$translate('transactions.to')} />
        <Checkbox bind:checked={automaticDestinationAllocation} label={$translate('wallets.convert_proportionally')} />
        {#if automaticDestinationAllocation}
          {#each destinationWalletAllocation?.shares ?? [] as share (share.walletId)}
            <div>
              {walletsService.getById(share.walletId)?.name ?? '…'}: {formatMoney(share.amount, {
                currency: destinationAccountCurrency,
              })}
            </div>
          {/each}
        {:else}
          <AllocationEditor
            bind:allocation={destinationWalletAllocation}
            currency={destinationAccountCurrency ?? 'EUR'}
            amount={Number(_value2)}
          />
        {/if}
      </div>
    {/if}
    <Input
      label={$translate('transactions.comment')}
      name="comment"
      value={comment}
      onChange={handleCommentChange}
      translate={$translate}
      list="suggestions"
      clearable
    />
    <datalist id="suggestions">
      {#each suggestions as option (option)}
        <option value={option}></option>
      {/each}
    </datalist>
    {#if comment && replaceCalcExpressions(comment) !== comment}
      <div class="comment-preview">
        {replaceCalcExpressions(comment)}
      </div>
    {/if}
    <div class="flex-col gap-0.5">
      <InputLabel text={$translate('transactions.tags')} />
      <TagsList
        bind:tags
        bind:selectedTags
        onAdd={(t) => operationTagsService.save(t)}
        onEdit={(t) => operationTagsService.save(t)}
        onDelete={(t) => operationTagsService.delete(t)}
      />
    </div>
    <div class="flex-col gap-0.5" data-testId="PurchaseContentsSection">
      <SpoilerToggle bind:hidden={purchaseContentsHidden} translate={$translate}>
        <span>{$translate('receipts.contents')}</span>
        {#if purchaseItems.length}
          <span class="purchase-items-count">
            {$translate('receipts.items_count', { values: { count: purchaseItems.length } })}
          </span>
        {/if}
      </SpoilerToggle>
      <div
        class="flex-col gap-1 purchase-contents-body"
        hidden={purchaseContentsHidden}
        on:invalid|capture={(event) => {
          purchaseContentsHidden = false;
          event.currentTarget.hidden = false;
        }}
      >
        <div class="flex-col gap-0.5">
          <div class="flex justify-between items-center">
            <label for="transaction-receipt-url">
              <InputLabel text={$translate('receipts.url')} />
            </label>
            {#if receiptUrl.trim()}
              <Button
                appearance="link"
                underlined={false}
                disabled={!receiptHref}
                text={$translate('common.open')}
                testId="OpenReceiptButton"
                onClick={() => {
                  if (receiptHref) window.open(receiptHref, '_blank', 'noopener,noreferrer');
                }}
              />
            {:else}
              <Button
                appearance="link"
                underlined={false}
                text={$translate('receipts.scan_qr')}
                testId="ScanReceiptQrButton"
                onClick={() => (receiptScannerOpened = true)}
              />
            {/if}
          </div>
          <Input
            id="transaction-receipt-url"
            aria-label={$translate('receipts.url')}
            name="receiptUrl"
            bind:value={receiptUrl}
            onChange={() => {
              receiptOrganizationName = undefined;
              receiptAddress = undefined;
            }}
            inputmode="url"
            testId="ReceiptUrlInput"
            clearable
            translate={$translate}
          />
        </div>
        <PurchaseItemsEditor bind:items={purchaseItems} currency={anotherCurrency || accountCurrency} />
      </div>
    </div>
    <div class="flex-col gap-0.5" data-testId="AdditionalParameters">
      <SpoilerToggle bind:hidden={additionalParametersHidden} translate={$translate}>
        {$translate('transactions.additional_parameters')}
      </SpoilerToggle>
      <div
        class="flex-col gap-1 additional-parameters-body"
        hidden={additionalParametersHidden}
        on:invalid|capture={(event) => {
          additionalParametersHidden = false;
          event.currentTarget.hidden = false;
        }}
      >
        {#if type !== 'TRANSFER'}
          <DebtAllocationEditor
            bind:debt
            amount={Number(_value1)}
            currency={accountCurrency ?? ''}
            {anotherCurrency}
            anotherCurrencyAmount={Number(_value2)}
            direction={type}
            onChange={(next) => {
              if (!next && systemDebtCategory) categoryId = null;
            }}
          />
        {/if}
        <Input
          label={$translate('transactions.description')}
          name="description"
          bind:value={description}
          translate={$translate}
          testId="DescriptionInput"
        />
        {#if verification}
          <div class="verification" class:problem={verification.status !== 'ok'} data-testId="VerificationInfo">
            <Icon
              name={verification.status === 'ok' ? 'mdi:check-decagram-outline' : 'mdi:alert-circle-outline'}
              size={1}
            />
            <span>
              {$translate(verificationMessage(verification.status), {
                values: { statement: verification.statement },
              })}
              {#if verification.status === 'mismatch' && verification.expected}
                {$translate('transactions.verification.expected', {
                  values: {
                    date: verification.expected.date ?? '—',
                    amount: verification.expected.amount ?? '—',
                  },
                })}
              {/if}
            </span>
          </div>
        {/if}
        <Checkbox bind:checked={excludeFromAnalysis} label={$translate('transactions.exclude_from_analytics')} />
        <div class="flex gap-1">
          <div class="flex-grow">
            <Checkbox
              bind:checked={repeatingChecked}
              onChange={handleRepeatingCheckboxChange}
              label={$translate('transactions.repeatings')}
            />
          </div>
          {#if repeatingChecked}
            <Button appearance="link" underlined={false} onClick={() => (repeatingModalOpened = true)}
              >{$translate('transactions.repeatings.configure')}</Button
            >
          {/if}
        </div>
      </div>
    </div>

    <div class="flex-col gap-0.25">
      <div class="location-header">
        <InputLabel text={$translate('transactions.geolocation')} />
        <div class="location-header-actions">
          {#if hasLocation}<Button
              appearance="link"
              color="danger"
              underlined={false}
              onClick={removeLocation}
              testId="RemoveLocationButton">{$translate('common.clear')}</Button
            >
          {:else}<Button
              appearance="link"
              underlined={false}
              disabled={locating}
              onClick={() => detectLocation()}
              testId="DetectLocationButton">{$translate('transactions.detect_geolocation')}</Button
            >{/if}
        </div>
      </div>
      <div class="location-value">
        <PlaceSelector
          places={knownPlaces}
          nearby={nearbyPlaces}
          selected={selectedKnownPlace}
          position={locationLat !== null && locationLng !== null
            ? { latitude: locationLat, longitude: locationLng }
            : null}
          onSelect={chooseKnownPlace}
          onAdd={() => openLocationPicker(true)}
        />
        <div class="location-actions">
          <Button
            color="white"
            aria-label={$translate(hasLocation ? 'transactions.edit_location' : 'transactions.choose_on_map')}
            title={$translate(hasLocation ? 'transactions.edit_location' : 'transactions.choose_on_map')}
            onClick={() => openLocationPicker()}
          >
            <span aria-hidden="true"><Icon name={hasLocation ? 'mdi:pencil' : 'mdi:map-outline'} size={1.25} /></span>
          </Button>
        </div>
      </div>
    </div>

    <slot></slot>
    <slot name="button"></slot>
    <slot name="footer"></slot>
  </div>
</form>

<AnotherCurrencyModal bind:opened={anotherCurrencyModalOpened} bind:anotherCurrency />

{#if receiptScannerOpened}
  <ReceiptScanner onApply={applyReceipt} onClose={() => (receiptScannerOpened = false)} />
{/if}

{#if locationPickerOpened}
  <LocationPicker
    initialPosition={locationLat !== null && locationLng !== null
      ? { latitude: locationLat, longitude: locationLng }
      : null}
    {currentPosition}
    initialName={editorPlace?.name ?? ''}
    confirmLabel="common.save"
    places={knownPlaces}
    onLocated={(position) => (currentPosition = position)}
    onSelect={onLocationSelected}
    onRemove={editorPlace ? removeKnownPlace : null}
    onClose={() => (locationPickerOpened = false)}
  />
{/if}

<RepeatingTypeModal
  bind:opened={repeatingTypeModalOpened}
  onCreateNew={() => {
    repeatingModalOpened = true;
    repeatingTypeModalOpened = false;
  }}
  onSelectExisting={() => {
    repeatingListVisible = true;
    repeatingTypeModalOpened = false;
  }}
  onCancel={() => {
    if (!repeating) repeatingChecked = false;
    repeatingTypeModalOpened = false;
  }}
/>

<RepeatingModal
  {repeating}
  date={datetime}
  opened={repeatingModalOpened}
  onSubmit={(value) => {
    repeating = value;
    repeatingModalOpened = false;
  }}
  onCancel={() => {
    if (!repeating) repeatingChecked = false;
    repeatingModalOpened = false;
  }}
/>

<SubScreen
  visible={repeatingListVisible}
  title={$translate('transactions.repeatings.select_repeating')}
  onBack={() => {
    if (!repeating) repeatingChecked = false;
    repeatingListVisible = false;
  }}
>
  <div class="p-1">
    <RepeatingsList
      repeatings={$repeatingsStore}
      onClick={(item) => {
        repeating = item;
        repeatingListVisible = false;
      }}
    />
  </div>
</SubScreen>

<SubScreen
  visible={timeZoneListVisible}
  title={$translate('timezones.select_time_zone')}
  onBack={() => (timeZoneListVisible = false)}
>
  <TimeZoneList
    onClick={(tz, shift) => {
      timeZone = tz;
      timeZoneShift = shift;
      date = dayjs.utc(datetime).tz(timeZone).format('YYYY-MM-DD');
      time = dayjs.utc(datetime).tz(timeZone).format('HH:mm');
      timeZoneListVisible = false;
    }}
  />
</SubScreen>

<style>
  .purchase-items-count {
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  .purchase-contents-body[hidden] {
    display: none;
  }
  .additional-parameters-body[hidden] {
    display: none;
  }
  .currency-rate-info {
    font-size: 0.9rem;
    text-align: right;
    color: var(--secondary-text-color);
  }
  .verification {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
  .verification.problem {
    color: var(--orange-color);
  }
  .comment-preview {
    font-size: 0.9em;
    margin-top: -0.5rem;
    margin-left: 0.5rem;
    color: var(--secondary-text-color);
  }
  .time-zone {
    flex-shrink: 1;
  }
  .time-shift {
    flex-shrink: 0;
    font-size: 0.9rem;
  }
  .location-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 1.5rem;
    gap: 0.5rem;
  }
  .location-value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--secondary-text-color);
    overflow-wrap: anywhere;
  }
  .location-header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .location-actions {
    display: flex;
    flex-shrink: 0;
    gap: 0.25rem;
    align-items: center;
  }
  .location-actions > :global(*) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    color: var(--active-color);
  }
  .location-actions :global(.icon-container) {
    display: flex;
  }
</style>
