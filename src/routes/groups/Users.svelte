<script lang="ts">
  import type { User } from '$lib/api/Api';
  export let users: User[];
</script>

<div>Users:</div>
<ul class="users-list">
  {#each users as user}
    <li>{user.name} ({user.email})</li>
  {/each}
</ul>
<a style:display="none" class="add-user" href="#add">Add user</a>

<style>
  .users-list {
    margin: 0;
    padding-left: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .users-list li {
    list-style: none;
  }
  .add-user {
    margin-left: 0.75rem;
  }
</style>
