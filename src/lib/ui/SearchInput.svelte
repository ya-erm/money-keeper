<script lang="ts">
  import Input from '@ya-erm/svelte-ui/Input';
  import { translate } from '#lib/translate/index.js';

  export let value = '';
  export let name = 'search';
</script>

<Input
  bind:value
  {name}
  placeholder={$translate('common.search')}
  aria-label={$translate('common.search')}
  inputmode="search"
  clearable
  translate={$translate}
>
  <span slot="start" class="search-icon" aria-hidden="true">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </svg>
  </span>
</Input>

<style>
  .search-icon {
    display: flex;
    align-items: center;
    padding-left: 0.75rem;
    padding-right: 0.5rem;
    color: var(--secondary-text-color);
    pointer-events: none;
  }
</style>
