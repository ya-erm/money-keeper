<script lang="ts">
  import Button from '$lib/ui/Button.svelte';
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Icon from '$lib/ui/Icon.svelte';

  let bordered = false;
</script>

<h2>Button</h2>
<div class="flex-col gap-1">
  <Checkbox label="with border" bind:checked={bordered} />
  <div class="flex flex-wrap gap-0.5">
    <Button appearance="solid" color="primary" text="Primary" {bordered} />
    <Button appearance="solid" color="secondary" text="Secondary" {bordered} />
    <Button appearance="solid" color="success" text="Success" {bordered} />
    <Button appearance="solid" color="danger" text="Danger" {bordered} />
    <Button appearance="solid" color="white" text="White" {bordered} />
  </div>
  <div class="flex flex-wrap gap-0.5">
    <Button appearance="transparent" color="primary" text="Primary" {bordered} />
    <Button appearance="transparent" color="secondary" text="Secondary" {bordered} />
    <Button appearance="transparent" color="success" text="Success" {bordered} />
    <Button appearance="transparent" color="danger" text="Danger" {bordered} />
    <Button appearance="transparent" color="white" text="White" {bordered} />
  </div>
  <div class="flex flex-wrap gap-0.5">
    Links:
    <Button appearance="link" color="primary" text="Primary" {bordered} />
    <Button appearance="link" color="secondary" text="Secondary" {bordered} />
    <Button appearance="link" color="success" text="Success" {bordered} />
    <Button appearance="link" color="danger" text="Danger" {bordered} />
    <Button appearance="link" color="white" text="White" {bordered} />
  </div>
  <div class="flex flex-wrap items-center gap-0.5">
    With icon:
    <Button text="Primary" {bordered}>
      <Icon name="mdi:pencil" />
    </Button>
    <Button {bordered}>
      <Icon name="mdi:pencil" />
    </Button>
    <Button appearance="transparent" {bordered}>
      <Icon name="mdi:pencil" />
    </Button>
  </div>
</div>
