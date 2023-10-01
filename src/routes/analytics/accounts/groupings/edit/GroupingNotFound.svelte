<script lang="ts">
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
</script>

<div class="flex-col flex-center">
  <h2>{$translate('analytics.groupings.grouping_not_found')}</h2>
  <a href={route('analytics.accounts.groupings')}>{$translate('common.go_back_to_list')}</a>
</div>
