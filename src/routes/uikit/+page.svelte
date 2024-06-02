<script>
  import { useTitle } from '$lib/ui/header';
  import Switch from '$lib/ui/Switch.svelte';
  import { darkMode } from '$lib/ui/theme';

  import Buttons from './Buttons.svelte';
  import Colors from './Colors.svelte';
  import Inputs from './Inputs.svelte';
  import Modals from './Modals.svelte';
  import Spoilers from './Spoilers.svelte';
  import Switches from './Switches.svelte';
  import Tags from './Tags.svelte';
  import Toasts from './Toasts.svelte';

  useTitle('UI Kit');
</script>

<div class="p-1">
  <h1>Theme</h1>
  <div class="flex gap-1 items-center">
    <Switch bind:checked={$darkMode} />
    <span>Dark mode</span>
  </div>
  <Colors />

  <h1>Components</h1>
  <Buttons />
  <Inputs />
  <Toasts />
  <Modals />
  <Spoilers />
  <Switches />
  <Tags />
</div>
