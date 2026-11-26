<script lang="ts">
  import Modal from '@ya-erm/svelte-ui/Modal';
  import { translate } from '#lib/translate/index.js';
  import ListSelectItem from '#lib/ui/list/ListSelectItem.svelte';
  import { themePreference, type ThemePreference } from './theme';

  let opened = false;
  const options: ThemePreference[] = ['light', 'dark', 'system'];
  const select = (value: ThemePreference) => {
    themePreference.set(value);
    opened = false;
  };
</script>

<ListSelectItem
  icon="mdi:moon-waning-crescent"
  title={$translate('settings.theme')}
  value={$translate(`settings.theme.${$themePreference}`)}
  onClick={() => (opened = true)}
/>

<Modal id="theme-modal" header={$translate('settings.theme')} {opened} onClose={() => (opened = false)}>
  <fieldset aria-label={$translate('settings.theme')}>
    {#each options as option (option)}
      <label>
        <input
          type="radio"
          name="theme-preference"
          value={option}
          checked={$themePreference === option}
          on:change={() => select(option)}
        />
        <span>{$translate(`settings.theme.${option}`)}</span>
      </label>
    {/each}
  </fieldset>
</Modal>

<style>
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.75rem;
    padding: 0.5rem;
    cursor: pointer;
  }
  input {
    accent-color: var(--active-color);
  }
</style>
