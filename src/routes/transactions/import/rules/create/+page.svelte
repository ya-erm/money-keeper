<script lang="ts">
  import { routes } from '$lib/routes';
  import { backLink } from '$lib/ui/header';

  import ImportRuleForm from '../ImportRuleForm.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  backLink.set(routes['transactions.import.rules'].path);
</script>

<ImportRuleForm action="?/create" categories={data.categories} tags={data.tags} />
