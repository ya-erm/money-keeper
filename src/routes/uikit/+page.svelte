<script>
  import Switch from '@ya-erm/svelte-ui/Switch';

  import Layout from '$lib/ui/layout/Layout.svelte';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import { darkMode } from '$lib/ui/theme';

  import Buttons from './Buttons.svelte';
  import Colors from './Colors.svelte';
  import Inputs from './Inputs.svelte';
  import Modals from './Modals.svelte';
  import Spoilers from './Spoilers.svelte';
  import Switches from './Switches.svelte';
  import Tags from './Tags.svelte';
  import Toasts from './Toasts.svelte';
</script>

<Layout title="UI Kit" leftSlot={HeaderBackButton}>
  <div class="p-1">
    <h1>Theme</h1>
    <label class="flex gap-1 items-center">
      <Switch bind:checked={$darkMode} />
      <span>Dark mode</span>
    </label>
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
</Layout>
