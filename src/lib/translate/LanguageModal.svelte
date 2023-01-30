<script lang="ts">
  import { activeLocale, languages, translate, type Locales } from '$lib/translate';
  import Button from '$lib/ui/Button.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import Modal from '$lib/ui/Modal.svelte';

  export let opened: boolean;

  let previousLocale: Locales;
  $: if (!previousLocale) {
    previousLocale = $activeLocale;
  }

  const selectLocale = (locale: string) => {
    activeLocale.set(locale as Locales);
  };

  const handleCancel = () => {
    activeLocale.set(previousLocale);
    opened = false;
  };

  const handleAccept = () => {
    opened = false;
  };
</script>

<Modal header={$translate('language.select_language')} {opened} on:close={handleCancel}>
  <ul class="flex-col">
    {#each Object.entries(languages) as [locale, language] (locale)}
      <li
        class="flex justify-between gap-0.5"
        class:active={$activeLocale === locale}
        on:click={() => selectLocale(locale)}
        aria-hidden
      >
        <div class="flex gap-0.5">
          <Icon name={language.icon} />
          <span>{language.name}</span>
        </div>
        {#if $activeLocale === locale}
          <Icon name="mdi:check" />
        {/if}
      </li>
    {/each}
  </ul>
  <div class="grid-col-2 gap-1">
    <Button text={$translate('common.cancel')} color="secondary" on:click={handleCancel} />
    <Button text={$translate('common.accept')} color="primary" on:click={handleAccept} />
  </div>
</Modal>

<style>
  ul {
    padding: 0;
    min-width: 14rem;
  }
  li {
    padding: 0.5rem;
  }
  li.active {
    color: var(--active-color);
  }
  @media (hover: hover) {
    li:hover {
      background: var(--hover-background-color);
    }
  }
</style>
