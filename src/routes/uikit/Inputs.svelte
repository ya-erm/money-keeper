<script lang="ts">
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Input from '$lib/ui/Input.svelte';

  let v2 = false;
  let withIcon = false;
  let disabled = false;
  let clearable = true;
  let withEndText = false;

  $: icon = withIcon ? 'mdi:search' : null;
  $: endText = withEndText ? 'END' : null;
</script>

<h2>Input</h2>
<div class="flex-col gap-1">
  <div class="flex flex-wrap gap-1">
    <Checkbox label="v2" bind:checked={v2} />
    <Checkbox label="icon" bind:checked={withIcon} />
    <Checkbox label="disabled" bind:checked={disabled} />
    <Checkbox label="clearable" bind:checked={clearable} />
    <Checkbox label="with end text" bind:checked={withEndText} />
  </div>
  <Input value="" placeholder="Placeholder" {icon} {endText} {clearable} {v2} {disabled} />
  <Input label="Text" value="Text input" optional {icon} {endText} {clearable} {v2} {disabled} />
  <Input label="Password" value="Password" type="password" {icon} {endText} {clearable} {v2} {disabled} />
  <Input label="Error" value="Value" error="Error text example" {icon} {endText} {clearable} {v2} {disabled} />
  <Input label="Color" type="color" {icon} {endText} {clearable} {v2} {disabled} />
</div>
