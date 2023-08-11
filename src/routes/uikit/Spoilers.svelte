<script>
  import Button from '$lib/ui/Button.svelte';
  import Spoiler from '$lib/ui/Spoiler.svelte';
  let hidden = true;
</script>

<h2>Spoilers</h2>

<Button on:click={() => (hidden = !hidden)}>Toggle</Button>
<Spoiler {hidden}>
  <h3>Content example</h3>
  <p>
    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quasi, vel assumenda inventore tenetur obcaecati,
    voluptatem, porro sequi reprehenderit dolorem hic perferendis vitae placeat. Incidunt repudiandae totam id dolor
    accusantium atque!
  </p>
</Spoiler>
