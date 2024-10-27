<script lang="ts">
  import { type ComponentProps } from 'svelte';

  import MultiSwitch from '$lib/ui/MultiSwitch.svelte';
  import Checkbox from '$lib/ui/Checkbox.svelte';

  let sameSize = false;

  const options: ComponentProps<MultiSwitch>['options'] = [
    { id: '1', title: 'First' },
    { id: '2', title: 'Second' },
    { id: '3', title: 'Third' },
  ];

  let selected = options[0];

  const optionsWithIcons: ComponentProps<MultiSwitch>['options'] = [
    { id: '1', icon: 'mdi:number-one-circle-outline', title: 'First' },
    { id: '2', icon: 'mdi:number-two-circle-outline', title: 'Second' },
    { id: '3', icon: 'mdi:number-three-circle-outline', title: 'Third' },
  ];
</script>

<h2>MultiSwitch</h2>
<div class="flex-col gap-1 items-start">
  <Checkbox bind:checked={sameSize} label="same size" />
  <MultiSwitch bind:selected options={options.slice(0, 2)} {sameSize} />
  <MultiSwitch bind:selected {options} {sameSize} />
  <MultiSwitch bind:selected options={optionsWithIcons} {sameSize} />
</div>
