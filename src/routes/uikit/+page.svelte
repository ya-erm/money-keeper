<script>
  import { title } from '$lib/store/navigation';
  import { darkMode } from '$lib/store/theme';
  import Switch from '$lib/Switch.svelte';

  import Buttons from './Buttons.svelte';
  import Colors from './Colors.svelte';
  import Inputs from './Inputs.svelte';
  import Toasts from './Toasts.svelte';

  title.set('UI Kit');
</script>

<div class="p-1">
  <h1>Theme</h1>
  <div class="flex gap-1 items-center">
    <Switch checked={darkMode} />
    <span>Dark mode</span>
  </div>
  <Colors />

  <h1>Components</h1>
  <Buttons />
  <Inputs />
  <Toasts />
</div>
