<script lang="ts">
  export let submit: (e: SubmitEvent) => void;
</script>

<div class="content">
  <form on:submit|preventDefault={submit} class="form-container">
    <slot />
  </form>
  <slot name="footer" />
</div>

<style>
  .content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .form-container {
    align-self: center;
    width: 300px;
    margin: 1rem auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
