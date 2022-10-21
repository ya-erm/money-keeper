<script lang="ts">
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import { showToast } from '$lib/ui/toasts';
  import type { ToastType } from '$lib/ui/toasts/toasts';
  import { writable } from 'svelte/store';

  const dismissible = writable(true);
  const message = writable('This is example of toast');

  const handleClick = (type: ToastType) => () => {
    showToast({ message: $message, dismissible: $dismissible, type });
  };
</script>

<h2>Toast</h2>
<div class="flex-col gap-1">
  <label>
    <input type="checkbox" bind:checked={$dismissible} />
    <span>dismissible</span>
  </label>
  <Input bind:value={$message} />
  <div>
    <Button text="Info" on:click={handleClick('info')} />
    <Button text="Success" color="success" on:click={handleClick('success')} />
    <Button text="Error" color="danger" on:click={handleClick('error')} />
  </div>
</div>
