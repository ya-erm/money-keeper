<script lang="ts">
  import { page } from '$app/stores';

  import type { CategoryType } from '$lib/interfaces';
  import { routes } from '$lib/routes';
  import { backLink } from '$lib/ui/header';
  import CreateCategoryForm from './CreateCategoryForm.svelte';

  backLink.set(routes.categories.path);

  const type = $page.url.searchParams.get('type') as CategoryType;
</script>

<CreateCategoryForm {type} />
