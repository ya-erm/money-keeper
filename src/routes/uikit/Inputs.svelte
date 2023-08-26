<script lang="ts">
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Input from '$lib/ui/Input.svelte';

  let clearable = true;
  let withEndText = false;
  $: endText = withEndText ? 'END' : null;
</script>

<h2>Input</h2>
<div class="flex-col gap-1">
  <div class="flex gap-1">
    <Checkbox label="clearable" bind:checked={clearable} />
    <Checkbox label="with end text" bind:checked={withEndText} />
  </div>
  <Input value="" placeholder="Placeholder" {endText} {clearable} />
  <Input label="Text" value="Text input" optional {endText} {clearable} />
  <Input label="Password" value="Password" type="password" {endText} {clearable} />
  <Input label="Error" value="Value" error="Error text example" {endText} {clearable} />
  <Input label="Color" type="color" {endText} {clearable} />
</div>
