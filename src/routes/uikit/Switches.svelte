<script lang="ts">
  import MultiSwitch from '$lib/ui/MultiSwitch.svelte';

  const options = [
    { id: '1', title: 'First' },
    { id: '2', title: 'Second' },
    { id: '3', title: 'Third' },
  ];

  let selected = options[0];
</script>

<h2>MultiSwitch</h2>
<div class="flex-col gap-1 items-start">
  <div>
    <MultiSwitch options={options.slice(0, 2)} {selected} />
  </div>
  <div>
    <MultiSwitch {options} {selected} />
  </div>
</div>
