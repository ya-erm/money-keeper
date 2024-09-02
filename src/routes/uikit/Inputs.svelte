<script lang="ts">
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Input from '$lib/ui/Input.svelte';

  let v2 = false;
  let clearable = true;
  let withEndText = false;
  $: endText = withEndText ? 'END' : null;
</script>

<h2>Input</h2>
<div class="flex-col gap-1">
  <div class="flex gap-1">
    <Checkbox label="v2" bind:checked={v2} />
    <Checkbox label="clearable" bind:checked={clearable} />
    <Checkbox label="with end text" bind:checked={withEndText} />
  </div>
  <Input value="" placeholder="Placeholder" {endText} {clearable} {v2} />
  <Input label="Text" value="Text input" optional {endText} {clearable} {v2} />
  <Input label="Password" value="Password" type="password" {endText} {clearable} {v2} />
  <Input label="Error" value="Value" error="Error text example" {endText} {clearable} {v2} />
  <Input label="Color" type="color" {endText} {clearable} {v2} />
</div>
