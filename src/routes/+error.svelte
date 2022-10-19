<script>
  import { page } from '$app/stores';
</script>

<div class="content">
  <h2>{$page.status}</h2>
  <span>{$page.error?.message}</span>
</div>

<style>
  .content {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
