<script lang="ts">
  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import HeaderButton from '$lib/ui/header/HeaderButton.svelte';
</script>

<div class="flex">
  <HeaderButton icon="mdi:format-list-bulleted" label={$translate('accounts.list')} href={route('accounts.list')} />
  <HeaderButton
    icon="mdi:credit-card-plus-outline"
    label={$translate('accounts.create_account')}
    href={route('accounts.list') + '?action=create'}
  />
</div>
