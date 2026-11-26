<script lang="ts">
  import dayjs from 'dayjs';

  import ChoiceModal from '#lib/ui/ChoiceModal.svelte';

  import { activeLocale, translate } from '#lib/translate/index.js';
  import { languages } from '#lib/translate/constants.js';
  import type { Locales } from '#lib/translate/types.js';
  import { setCookie } from '#lib/utils/cookie.js';

  export let opened: boolean;

  let accepted = false;

  let previousLocale: Locales | null;

  const beginSelection = () => {
    previousLocale = $activeLocale;
    accepted = false;
  };

  $: if (opened) beginSelection();

  const options = Object.entries(languages).map(([value, language]) => ({
    value,
    label: language.name,
    icon: language.icon,
  }));

  const selectLocale = (locale: string) => {
    activeLocale.set(locale as Locales);
  };

  const handleClose = () => {
    if (!accepted) {
      activeLocale.set(previousLocale);
    }
    opened = false;
  };

  const handleAccept = () => {
    if ($activeLocale) {
      setCookie('locale', $activeLocale, { expires: dayjs().add(1, 'year').toDate() });
    }
    accepted = true;
    opened = false;
  };
</script>

<ChoiceModal
  id="language-modal"
  header={$translate('language.select_language')}
  {opened}
  {options}
  value={$activeLocale}
  onSelect={selectLocale}
  onClose={handleClose}
  onAccept={handleAccept}
/>
