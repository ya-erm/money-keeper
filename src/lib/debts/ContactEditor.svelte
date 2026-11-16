<script lang="ts">
  import { v4 as uuid } from 'uuid';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import InputLabel from '@ya-erm/svelte-ui/InputLabel';
  import { debtContactsService } from '#lib/data/debtContacts.js';
  import type { ContactGrammaticalForm, DebtContact } from '#lib/data/interfaces.js';
  import { translate } from '#lib/translate/index.js';
  import SubScreen from '#lib/ui/layout/SubScreen.svelte';
  import { handleError } from '#lib/utils/handleError.js';

  export let contact: DebtContact | null = null;
  export let initialName = '';
  export let onClose: () => void;
  export let onSave: (contact: DebtContact) => void = () => {};
  let name = contact?.name ?? initialName;
  let note = contact?.note ?? '';
  let grammaticalForm: ContactGrammaticalForm | '' = contact?.grammaticalForm ?? '';
  let saving = false;
  const savedId = contact?.id ?? uuid();

  async function save(archived = contact?.archived) {
    if (!name.trim() || saving) return;
    saving = true;
    try {
      const saved: DebtContact = {
        ...contact,
        id: savedId,
        createdAt: contact?.createdAt ?? new Date().toISOString(),
        name: name.trim(),
        note: note.trim(),
        archived,
      };
      if (grammaticalForm) saved.grammaticalForm = grammaticalForm;
      else delete saved.grammaticalForm;
      await debtContactsService.save(saved);
      onSave(saved);
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      saving = false;
    }
  }
</script>

<SubScreen
  visible
  title={$translate(contact ? 'debts.edit_contact' : 'debts.new_contact')}
  onBack={onClose}
  testId="ContactEditor"
>
  <form class="flex-col gap-1 p-1" on:submit|preventDefault={() => save()} data-testId="ContactForm">
    <Input label={$translate('debts.name')} bind:value={name} name="name" required maxlength={100} />
    <label class="grammar-field"
      ><InputLabel text={$translate('debts.grammatical_form')} />
      <select bind:value={grammaticalForm} name="grammaticalForm" data-testId="ContactGrammaticalForm">
        <option value="">{$translate('debts.form_unspecified')}</option>
        <option value="masculine">{$translate('debts.form_masculine')}</option>
        <option value="feminine">{$translate('debts.form_feminine')}</option>
        <option value="neuter">{$translate('debts.form_neuter')}</option>
        <option value="plural">{$translate('debts.form_plural')}</option>
      </select>
    </label>
    <Input
      label={$translate('debts.note')}
      bind:value={note}
      name="note"
      maxlength={500}
      optional
      translate={$translate}
    />
    <Button type="submit" disabled={saving || !name.trim()} text={$translate('common.save')} testId="SaveContact" />
    {#if contact}
      <Button
        appearance="transparent"
        disabled={saving}
        onClick={() => save(!contact?.archived)}
        text={$translate(contact.archived ? 'debts.restore' : 'debts.archive')}
      />
    {/if}
  </form>
</SubScreen>

<style>
  .grammar-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .grammar-field select {
    width: 100%;
    min-width: 0;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    font: inherit;
    color: var(--primary-text-color);
    background: var(--header-background-color);
  }
</style>
