<script>
  import Spoiler from '$lib/ui/Spoiler.svelte';
  import SpoilerToggle from '$lib/ui/SpoilerToggle.svelte';
  let hidden = true;
</script>

<h2>Spoilers</h2>

<SpoilerToggle bind:hidden>Spoiler Toggle</SpoilerToggle>
<Spoiler {hidden}>
  <h3>Content example</h3>
  <p>
    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quasi, vel assumenda inventore tenetur obcaecati,
    voluptatem, porro sequi reprehenderit dolorem hic perferendis vitae placeat. Incidunt repudiandae totam id dolor
    accusantium atque!
  </p>
</Spoiler>
