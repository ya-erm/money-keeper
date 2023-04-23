<script lang="ts">
  import type { PageData } from './$types';
  import Settings from './Settings.svelte';

  export let data: PageData;
  const { user, userId, groups, group, groupId, version } = data;
</script>

<Settings {user} {userId} {groups} {group} {groupId} {version} />
