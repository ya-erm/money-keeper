<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';

  import { route } from '$lib/routes';
  import { translate } from '$lib/translate';
  import type { Messages } from '$lib/translate/types';
  import Layout from '$lib/ui/layout/Layout.svelte';

  import AccountsCardPreview from './AccountsCardPreview.svelte';
  import BalanceCardPreview from './BalanceCardPreview.svelte';
  import CategoriesCardPreview from './CategoriesCardPreview.svelte';
  import IncomeExpensesCardPreview from './IncomeExpensesCardPreview.svelte';

  type AnalyticsCard = {
    title: Messages;
    href: string;
    icon: string;
    preview: 'donut' | 'accounts' | 'line' | 'bars';
  };

  const cards: AnalyticsCard[] = [
    {
      title: 'analytics.cards.categories',
      href: route('analytics.categories'),
      icon: 'mdi:shape-outline',
      preview: 'donut',
    },
    {
      title: 'analytics.cards.accounts',
      href: route('analytics.accounts'),
      icon: 'mdi:briefcase-outline',
      preview: 'accounts',
    },
    {
      title: 'analytics.cards.balance',
      href: route('analytics.balance'),
      icon: 'mdi:analytics',
      preview: 'line',
    },
    {
      title: 'analytics.cards.income_expenses',
      href: route('analytics.income_expenses'),
      icon: 'mdi:swap-horizontal',
      preview: 'bars',
    },
  ];
</script>

<Layout title={$translate('analytics.title')}>
  <nav class="analytics-grid" aria-label={$translate('analytics.title')}>
    {#each cards as card (card.href)}
      <a class="analytics-card" href={card.href} aria-label={$translate(card.title)}>
        <div class="card-header">
          <span class="icon-wrap">
            <Icon name={card.icon} size={1.5} />
          </span>
          <span class="card-title">{$translate(card.title)}</span>
          <Icon name="mdi:chevron-right" />
        </div>

        <div
          class="preview"
          class:data-preview-container={card.preview === 'donut' ||
            card.preview === 'accounts' ||
            card.preview === 'line' ||
            card.preview === 'bars'}
          class:accounts-preview-container={card.preview === 'accounts'}
          class:chart-preview-container={card.preview === 'line' || card.preview === 'bars'}
        >
          {#if card.preview === 'donut'}
            <CategoriesCardPreview />
          {:else if card.preview === 'accounts'}
            <AccountsCardPreview />
          {:else if card.preview === 'line'}
            <BalanceCardPreview />
          {:else}
            <IncomeExpensesCardPreview />
          {/if}
        </div>
      </a>
    {/each}
  </nav>
</Layout>

<style>
  .analytics-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    max-width: 48rem;
    margin: 0 auto;
    padding: 1rem;
  }

  .analytics-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 10rem;
    padding: 0.875rem;
    color: var(--primary-text-color);
    text-decoration: none;
    background: var(--header-background-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    transition:
      border-color 0.2s,
      transform 0.2s,
      background-color 0.2s;
  }

  .analytics-card:focus-visible {
    border-color: var(--active-color);
    background: var(--hover-background-color);
    transform: translateY(-1px);
  }

  .analytics-card:focus-visible {
    outline: 2px solid var(--active-color);
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .analytics-card:hover {
      border-color: var(--active-color);
      background: var(--hover-background-color);
      transform: translateY(-1px);
    }
  }

  .card-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.625rem;
  }

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    color: var(--active-color);
    background: var(--hover-background-color);
    border-radius: 0.5rem;
  }

  .card-title {
    overflow: hidden;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview {
    position: relative;
    height: 4.5rem;
    margin-top: 0.5rem;
    overflow: hidden;
    border-radius: 0.375rem;
    background:
      linear-gradient(var(--border-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
    background-color: var(--background-color);
    background-size:
      100% 1.5rem,
      25% 100%;
  }

  .preview.data-preview-container {
    height: 6rem;
    background: var(--background-color);
  }

  .preview.accounts-preview-container {
    height: 7.5rem;
  }

  .preview.chart-preview-container {
    height: 7.5rem;
  }

  @media (min-width: 30rem) {
    .analytics-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
