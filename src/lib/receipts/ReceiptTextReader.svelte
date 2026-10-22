<script lang="ts">
  import { onDestroy } from 'svelte';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import { translate } from '$lib/translate';
  import type { Messages } from '$lib/translate/messages';
  import {
    counterExtensions,
    normalizeReceiptAmount,
    parseReceiptText,
    validReceiptDateTime,
    type ReceiptTextFields,
  } from './receiptText';
  import { recognizeReceiptText } from './recognizeReceiptText';

  export let onBack: () => void;
  let fields = parseReceiptText('');
  let busy = false;
  let progress = 0;
  let error: Messages | null = null;
  let recognized = false;
  let copied = '';
  let photoUrl = '';
  let controller: AbortController | undefined;
  let cameraInput: HTMLInputElement;
  let galleryInput: HTMLInputElement;
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  const inputs: { key: Exclude<keyof ReceiptTextFields, 'extension'>; label: Messages; placeholder: string }[] = [
    { key: 'invoiceNumber', label: 'receipts.ocr.invoice', placeholder: 'XXXXXXXX-XXXXXXXX-00000' },
    { key: 'counter', label: 'receipts.ocr.counter', placeholder: '00000/00000' },
    { key: 'amount', label: 'receipts.ocr.amount', placeholder: '0.00' },
    { key: 'dateTime', label: 'receipts.ocr.date', placeholder: 'DD.MM.YYYY HH:mm:ss' },
  ];
  $: valid = {
    invoiceNumber: /^[A-Z0-9]{8}-[A-Z0-9]{8}-\d{1,12}$/.test(fields.invoiceNumber),
    counter:
      /^\d{1,12}\/\d{1,12}$/.test(fields.counter) &&
      (!fields.invoiceNumber || fields.counter.split('/')[1] === fields.invoiceNumber.split('-')[2]),
    amount: !!normalizeReceiptAmount(fields.amount),
    dateTime: validReceiptDateTime(fields.dateTime),
  };

  const cancel = () => {
    controller?.abort();
    controller = undefined;
    busy = false;
  };
  onDestroy(() => {
    cancel();
    clearTimeout(copyTimer);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });

  const readPhoto = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    cancel();
    error = null;
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) {
      error = 'receipts.photo_failed';
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file);
    const current = new AbortController();
    controller = current;
    busy = true;
    progress = 0;
    try {
      const image = new Image();
      image.src = photoUrl;
      await image.decode();
      if (current.signal.aborted) return;
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const text = await recognizeReceiptText(canvas, current.signal, (value) => {
        if (!current.signal.aborted) progress = Math.max(progress, Math.round(value));
      });
      if (current.signal.aborted) return;
      fields = parseReceiptText(text);
      recognized = true;
      if (!Object.values(fields).some(Boolean)) error = 'receipts.ocr.no_fields';
    } catch {
      if (!current.signal.aborted) error = 'receipts.ocr.failed';
    } finally {
      if (controller === current) busy = false;
    }
  };

  const copy = async (key: keyof ReceiptTextFields) => {
    error = null;
    try {
      await navigator.clipboard.writeText(key === 'amount' ? normalizeReceiptAmount(fields.amount) : fields[key]);
      copied = key;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = ''), 2000);
    } catch {
      error = 'receipts.ocr.copy_failed';
    }
  };
</script>

<div class="flex-col gap-1" data-testId="ReceiptTextReader">
  <p class="hint">{$translate('receipts.ocr.hint')}</p>
  <div class="photo-buttons">
    <Button color="white" bordered disabled={busy} onClick={() => cameraInput.click()}>
      <span class="button-content"
        ><Icon name="mdi:camera-outline" size={1.25} />{$translate('receipts.ocr.take_photo')}</span
      >
    </Button>
    <Button color="white" bordered disabled={busy} onClick={() => galleryInput.click()}>
      <span class="button-content"><Icon name="mdi:image-outline" size={1.25} />{$translate('receipts.photo')}</span>
    </Button>
  </div>
  <input
    bind:this={cameraInput}
    type="file"
    accept="image/*"
    capture="environment"
    on:change={readPhoto}
    aria-label={$translate('receipts.ocr.take_photo')}
    data-testId="ReceiptTextCameraInput"
    hidden
  />
  <input
    bind:this={galleryInput}
    type="file"
    accept="image/*"
    on:change={readPhoto}
    aria-label={$translate('receipts.photo')}
    data-testId="ReceiptTextPhotoInput"
    hidden
  />
  {#if photoUrl}<img class="receipt-photo" src={photoUrl} alt={$translate('receipts.ocr.photo')} />{/if}
  {#if busy}
    <div class="flex-col gap-0.5" role="status">
      <p class="hint">{$translate('receipts.ocr.progress', { values: { progress } })}</p>
      <progress value={progress} max="100"></progress>
      <Button color="white" bordered text={$translate('common.cancel')} onClick={cancel} />
    </div>
  {/if}
  {#if error}<p class="hint" role="alert">{$translate(error)}</p>{/if}
  {#if !busy}
    <p class="hint">{$translate(recognized ? 'receipts.ocr.review' : 'receipts.ocr.manual')}</p>
    {#each inputs as field (field.key)}
      <div class="field-row">
        <Input
          label={$translate(field.label)}
          bind:value={fields[field.key]}
          name={`receipt-ocr-${field.key}`}
          placeholder={field.placeholder}
          inputmode={field.key === 'amount' ? 'decimal' : 'text'}
          error={(recognized || fields[field.key]) && !valid[field.key] ? $translate('receipts.ocr.check_field') : null}
        />
        <Button
          color="white"
          bordered
          disabled={!valid[field.key]}
          onClick={() => copy(field.key)}
          aria-label={$translate('receipts.ocr.copy_field', { values: { field: $translate(field.label) } })}
        >
          <Icon name={copied === field.key ? 'mdi:check' : 'mdi:content-copy'} size={1.25} />
        </Button>
      </div>
      {#if field.key === 'counter'}
        <div class="extension-row">
          <label for="receipt-counter-extension">{$translate('receipts.ocr.extension')}</label>
          <select id="receipt-counter-extension" bind:value={fields.extension}>
            <option value="">—</option>
            {#each counterExtensions as extension (extension)}<option value={extension}>{extension}</option>{/each}
          </select>
          <Button
            appearance="link"
            disabled={!fields.extension}
            onClick={() => copy('extension')}
            aria-label={$translate('receipts.ocr.copy_field', {
              values: { field: $translate('receipts.ocr.extension') },
            })}
          >
            <Icon name={copied === 'extension' ? 'mdi:check' : 'mdi:content-copy'} size={1.25} />
          </Button>
        </div>
      {/if}
    {/each}
    <p class="hint">{$translate('receipts.ocr.verify_hint')}</p>
    <a class="verify-link" href="https://suf.purs.gov.rs/verify" target="_blank" rel="noopener noreferrer"
      >{$translate('receipts.ocr.verify')}</a
    >
  {/if}
  <Button color="white" bordered text={$translate('receipts.ocr.back')} onClick={onBack} />
</div>

<style>
  p {
    margin: 0;
  }
  .hint {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }
  .photo-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .button-content {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
  }
  .receipt-photo {
    width: 100%;
    max-height: 12rem;
    object-fit: contain;
    border-radius: 0.5rem;
  }
  .field-row {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .field-row :global(.input-label) {
    min-width: 0;
  }
  .field-row :global(button) {
    margin-top: 1.75rem;
  }
  .extension-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  select {
    color: inherit;
    background: var(--input-background-color, #fff);
    font: inherit;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 0.5rem;
    padding: 0.5rem;
  }
  progress {
    width: 100%;
    accent-color: var(--active-color);
  }
  .verify-link {
    text-align: center;
    padding: 0.75rem;
    border-radius: 0.75rem;
    color: #fff;
    background: var(--active-color);
    text-decoration: none;
  }
</style>
