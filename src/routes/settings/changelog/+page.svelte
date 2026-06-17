<script lang="ts">
  import { getChangelogEntries } from '$lib/changelog';
  import { activeLocale, translate } from '$lib/translate';
  import HeaderBackButton from '$lib/ui/layout/HeaderBackButton.svelte';
  import Layout from '$lib/ui/layout/Layout.svelte';

  $: changelogEntries = getChangelogEntries($activeLocale);
</script>

<Layout title={$translate('settings.changelog')} leftSlot={HeaderBackButton}>
  <div class="changelog">
    {#each changelogEntries as entry (entry.version)}
      <article class="release">
        <header class="release-header">
          <h2>{entry.version}</h2>
          {#if entry.date}
            <time datetime={entry.date}>{entry.date}</time>
          {/if}
        </header>

        {#each entry.sections as section (section.title)}
          <section class="release-section">
            <h3>{section.title}</h3>
            <ul>
              {#each section.items as item, index (`${entry.version}-${section.title}-${index}`)}
                <li>{item}</li>
              {/each}
            </ul>
          </section>
        {/each}
      </article>
    {/each}
  </div>
</Layout>

<style>
  .changelog {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    padding-bottom: 2rem;
  }

  .release {
    background: var(--header-background-color);
    border-radius: 10px;
    padding: 1rem;
  }

  .release-header {
    align-items: baseline;
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
  }

  h2,
  h3 {
    margin: 0;
  }

  h2 {
    font-size: 1.2rem;
  }

  h3 {
    color: var(--secondary-text-color);
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 1rem;
    text-transform: uppercase;
  }

  time {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
    white-space: nowrap;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    line-height: 1.4;
    margin: 0.5rem 0 0;
    padding-left: 1.25rem;
  }

  li {
    overflow-wrap: anywhere;
  }
</style>
