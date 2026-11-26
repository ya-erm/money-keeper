<script lang="ts">
  import { translate } from '#lib/translate/index.js';
  import ListSelectItem from '#lib/ui/list/ListSelectItem.svelte';
  import ChoiceModal from '#lib/ui/ChoiceModal.svelte';
  import { themePreference, type ThemePreference } from './theme';

  let opened = false;
  let pending: ThemePreference = 'system';
  const modes = [
    { value: 'light' as const, icon: 'mdi:lightbulb-outline' },
    { value: 'dark' as const, icon: 'mdi:moon-waning-crescent' },
    { value: 'system' as const, icon: 'mdi:cellphone' },
  ];
  $: options = modes.map((option) => ({ ...option, label: $translate(`settings.theme.${option.value}`) }));
  const open = () => {
    pending = $themePreference;
    opened = true;
  };
  const accept = () => {
    themePreference.set(pending);
    opened = false;
  };
</script>

<ListSelectItem
  icon="mdi:moon-waning-crescent"
  title={$translate('settings.theme')}
  value={$translate(`settings.theme.${$themePreference}`)}
  onClick={open}
/>

<ChoiceModal
  id="theme-modal"
  header={$translate('settings.theme')}
  {opened}
  {options}
  value={pending}
  onSelect={(value) => (pending = value as ThemePreference)}
  onAccept={accept}
  onClose={() => (opened = false)}
/>
