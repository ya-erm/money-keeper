<script>
  import Spoiler from '@ya-erm/svelte-ui/Spoiler';
  import SpoilerToggle from '@ya-erm/svelte-ui/SpoilerToggle';

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
