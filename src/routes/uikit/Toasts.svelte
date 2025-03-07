<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Checkbox from '@ya-erm/svelte-ui/Checkbox';
  import Input from '@ya-erm/svelte-ui/Input';
  import { showToast, type ToastType } from '@ya-erm/svelte-ui/toasts';

  let dismissible = true;
  let message = 'This is example of toast';

  const handleClick = (type: ToastType) => () => {
    showToast({ message, dismissible, type });
  };
</script>

<h2>Toast</h2>
<div class="flex-col gap-1">
  <Checkbox label="dismissible" bind:checked={dismissible} />
  <Input bind:value={message} />
  <div>
    <Button text="Info" onClick={handleClick('info')} />
    <Button text="Success" color="success" onClick={handleClick('success')} />
    <Button text="Error" color="danger" onClick={handleClick('error')} />
  </div>
</div>
