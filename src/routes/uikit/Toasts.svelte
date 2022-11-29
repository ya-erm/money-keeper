<script lang="ts">
  import Button from '$lib/ui/Button.svelte';
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { showToast } from '$lib/ui/toasts';
  import type { ToastType } from '$lib/ui/toasts/toasts';

  let dismissible = true;
  let message = 'This is example of toast';

  const handleClick = (type: ToastType) => () => {
    showToast({ message, dismissible, type });
  };
</script>

<h2>Toast</h2>
<div class="flex-col gap-1">
  <Checkbox label="dismissable" bind:checked={dismissible} />
  <Input bind:value={message} />
  <div>
    <Button text="Info" on:click={handleClick('info')} />
    <Button text="Success" color="success" on:click={handleClick('success')} />
    <Button text="Error" color="danger" on:click={handleClick('error')} />
  </div>
</div>
