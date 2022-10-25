<script>
  import Input from '$lib/ui/Input.svelte';
</script>

<h2>Input</h2>
<div class="flex-col gap-1">
  <Input value="" placeholder="Placeholder" />
  <Input label="Text" value="Text input" optional />
  <Input label="Password" value="Password" type="password" />
  <Input label="Error" value="Value" error="Error text example" />
</div>
