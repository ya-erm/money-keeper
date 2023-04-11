<script lang="ts">
  export let visible = false;
</script>

<div class="loader">
  {#if visible}
    <div class="indicator" />
  {/if}
</div>

<style>
  .loader {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 2em;
  }

  .indicator,
  .indicator:before,
  .indicator:after {
    border-radius: 50%;
    width: 2em;
    height: 2em;
    animation-fill-mode: both;
    animation: FadeInOut 1.5s infinite ease-in-out;
  }
  .indicator {
    font-size: 7px;
    position: relative;
    transform: translateZ(0);
    animation-delay: 0.2s;
  }
  .indicator:before,
  .indicator:after {
    content: '';
    position: absolute;
    top: 0;
  }
  .indicator:before {
    left: -3.5em;
  }
  .indicator:after {
    left: 3.5em;
    animation-delay: 0.4s;
  }

  @keyframes FadeInOut {
    0%,
    80%,
    100% {
      background-color: transparent;
    }
    40% {
      background-color: var(--active-color);
    }
  }
</style>
