<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import SearchInput from '#lib/ui/SearchInput.svelte';
  import { debtContactsStore } from '#lib/data/debtContacts.js';
  import ContactEditor from '#lib/debts/ContactEditor.svelte';
  import ContactDetails from '#lib/debts/ContactDetails.svelte';
  import { translate } from '#lib/translate/index.js';
  import Layout from '#lib/ui/layout/Layout.svelte';
  import HeaderBackButton from '#lib/ui/layout/HeaderBackButton.svelte';
  import ContactAddButton from './ContactAddButton.svelte';
  let query = '';
  let archived = false;
  let limit = 30;
  let creating = false;
  let detailId: string | null = null;
  $: contacts = $debtContactsStore
    .filter(
      (contact) =>
        !!contact.archived === archived && contact.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
</script>

<Layout
  title={$translate('debts.contacts')}
  leftSlot={HeaderBackButton}
  rightSlot={ContactAddButton}
  rightSlotProps={{ onClick: () => (creating = true) }}
>
  <div class="contacts-page">
    <SearchInput bind:value={query} name="contact-search" />
    <div class="filters">
      <button type="button" class:active={!archived} on:click={() => (archived = false)}
        >{$translate('debts.all_contacts')}</button
      ><button type="button" class:active={archived} on:click={() => (archived = true)}
        >{$translate('debts.archived')}</button
      >
    </div>
    {#each contacts.slice(0, limit) as contact (contact.id)}
      <button type="button" class="contact-row" data-testId="ContactRow" on:click={() => (detailId = contact.id)}>
        <span class="avatar" aria-hidden="true">{contact.name.charAt(0)}</span><span class="contact-text"
          ><span>{contact.name}</span>{#if contact.note}<span class="note">{contact.note}</span>{/if}</span
        ><span class="chevron" aria-hidden="true"><Icon name="mdi:chevron-right" size={1.25} /></span>
      </button>
    {:else}<p class="empty">
        {$translate(
          query ? 'common.nothing_found' : archived ? 'debts.empty_archived_contacts' : 'debts.empty_contacts',
        )}
      </p>{/each}
    {#if contacts.length > limit}<Button
        appearance="link"
        onClick={() => (limit += 30)}
        text={$translate('common.show_more')}
      />{/if}
    <Button onClick={() => (creating = true)} text={$translate('debts.new_contact')} testId="AddContact" />
  </div>
</Layout>
{#if creating}<ContactEditor onClose={() => (creating = false)} />{/if}
{#if detailId}<ContactDetails contactId={detailId} onClose={() => (detailId = null)} />{/if}

<style>
  .contacts-page {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .filters {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .filters button {
    font: inherit;
    border: 0;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    color: var(--secondary-text-color);
    background: var(--header-background-color);
    cursor: pointer;
  }
  .filters button.active {
    color: var(--active-color);
  }
  .contact-row {
    display: flex;
    width: 100%;
    gap: 0.75rem;
    align-items: center;
    padding: 1rem;
    background: var(--header-background-color);
    border-radius: 1rem;
    text-align: left;
    font: inherit;
    color: var(--primary-text-color);
    border: 0;
    cursor: pointer;
  }
  .avatar {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    background: var(--background-color);
    border-radius: 50%;
    flex-shrink: 0;
  }
  .contact-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    overflow-wrap: anywhere;
  }
  .chevron {
    display: flex;
    flex-shrink: 0;
    color: var(--secondary-text-color);
  }
  .note,
  .empty {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
</style>
