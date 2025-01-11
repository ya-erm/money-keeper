<script lang="ts">
  import dayjs from 'dayjs';

  import Button from '@ya-erm/svelte-ui/Button';
  import ButtonBase from '@ya-erm/svelte-ui/ButtonBase';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Modal from '@ya-erm/svelte-ui/Modal';

  import { activeLocale, translate } from '$lib/translate';
  import { languages } from '$lib/translate/constants';
  import type { Locales } from '$lib/translate/types';
  import { setCookie } from '$lib/utils/cookie';

  export let opened: boolean;

  let accepted = false;

  let previousLocale: Locales | null;

  $: if (!previousLocale) {
    previousLocale = $activeLocale;
  }

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

<Modal id="language-modal" header={$translate('language.select_language')} {opened} onClose={handleClose}>
  <div class="items flex-col" role="listbox">
    {#each Object.entries(languages) as [locale, language] (locale)}
      {@const selected = $activeLocale === locale}
      <ButtonBase onClick={() => selectLocale(locale)} role="option" aria-selected={selected}>
        <div class="option w-full flex justify-between gap-0.5 p-0.5" class:active={selected}>
          <div class="flex gap-0.5">
            <Icon name={language.icon} />
            <span>{language.name}</span>
          </div>
          {#if selected}
            <Icon name="mdi:check" />
          {/if}
        </div>
      </ButtonBase>
    {/each}
  </div>
  <div class="grid-col-2 gap-1">
    <Button text={$translate('common.cancel')} color="secondary" onClick={handleClose} />
    <Button text={$translate('common.accept')} color="primary" onClick={handleAccept} />
  </div>
</Modal>

<style>
  .items {
    padding: 0;
    margin: 1rem 0;
    min-width: 14rem;
    list-style: none;
    gap: 0.25rem;
  }
  .active {
    color: var(--active-color);
  }
  @media (hover: hover) {
    .option:hover {
      background: var(--hover-background-color);
    }
  }
</style>
