<script lang="ts">
</script>

<div class="settings-group-item">
  <slot />
</div>

<style>
  .settings-group-item {
    min-height: 36px;
    font-size: 14px;
    display: flex;
    align-items: center;
    position: relative;
  }
  .settings-group-item:not(:last-child) {
    margin-bottom: 1px;
  }
  .settings-group-item:not(:last-child):after {
    position: absolute;
    content: '';
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background-color: var(--border-color);
  }
</style>
