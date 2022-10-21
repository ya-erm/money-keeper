<script lang="ts">
  import Button from '$lib/ui/Button.svelte';
  import { writable } from 'svelte/store';

  const bordered = writable(false);
</script>

<h2>Button</h2>
<div class="flex-col gap-1">
  <label>
    <input type="checkbox" bind:checked={$bordered} />
    <span>with border</span>
  </label>
  <div>
    <Button appearance="solid" color="primary" text="Primary" bordered={$bordered} />
    <Button appearance="solid" color="secondary" text="Secondary" bordered={$bordered} />
    <Button appearance="solid" color="success" text="Success" bordered={$bordered} />
    <Button appearance="solid" color="danger" text="Danger" bordered={$bordered} />
    <Button appearance="solid" color="white" text="White" bordered={$bordered} />
  </div>
  <div>
    <Button appearance="transparent" color="primary" text="Primary" bordered={$bordered} />
    <Button appearance="transparent" color="secondary" text="Secondary" bordered={$bordered} />
    <Button appearance="transparent" color="success" text="Success" bordered={$bordered} />
    <Button appearance="transparent" color="danger" text="Danger" bordered={$bordered} />
    <Button appearance="transparent" color="white" text="White" bordered={$bordered} />
  </div>
</div>
