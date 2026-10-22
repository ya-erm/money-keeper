<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import dayjs from 'dayjs';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import { translate } from '$lib/translate';
  import type { Messages } from '$lib/translate/messages';
  import { parseSerbianReceipt, ReceiptError, type SerbianReceipt, type ReceiptDetails } from './serbianReceipt';
  import ReceiptTextReader from './ReceiptTextReader.svelte';

  export let onApply: (receipt: SerbianReceipt) => void;
  export let onClose: () => void;

  let opened = true;
  let textMode = false;
  let link = '';
  let receipt: SerbianReceipt | null = null;
  let error: Messages | null = null;
  let busy = false;
  let camera = false;
  let startingCamera = true;
  let video: HTMLVideoElement;
  let stream: MediaStream | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let linkTimer: ReturnType<typeof setTimeout> | undefined;
  let revision = 0;
  let destroyed = false;
  let loadingDetails = false;
  let detailsError = false;
  let detailsController: AbortController | null = null;
  let photoInput: HTMLInputElement;
  const decoder = () => import('jsqr').then((module) => module.default);

  $: if (!opened) onClose();

  const stopCamera = () => {
    revision++;
    clearTimeout(timer);
    clearTimeout(linkTimer);
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) video.srcObject = null;
    camera = false;
    startingCamera = false;
  };

  onDestroy(() => {
    destroyed = true;
    detailsController?.abort();
    stopCamera();
  });

  onMount(() => {
    void startCamera();
  });

  const readReceipt = (value: string) => {
    detailsController?.abort();
    loadingDetails = false;
    detailsError = false;
    try {
      receipt = parseSerbianReceipt(value);
      error = null;
      void loadDetails();
    } catch (e) {
      receipt = null;
      error = e instanceof ReceiptError ? `receipts.${e.reason}` : 'receipts.invalid';
    }
  };

  const handleLinkChange = (value: string) => {
    link = value;
    error = null;
    clearTimeout(linkTimer);
    if (!value.trim()) return;
    linkTimer = setTimeout(() => {
      if (destroyed || receipt || link !== value) return;
      stopCamera();
      readReceipt(value);
    }, 250);
  };

  const resetReceipt = async () => {
    stopCamera();
    detailsController?.abort();
    detailsController = null;
    receipt = null;
    link = '';
    error = null;
    detailsError = false;
    loadingDetails = false;
    startingCamera = true;
    await tick();
    if (!destroyed) void startCamera();
  };

  const loadDetails = async () => {
    if (!receipt || loadingDetails) return;
    const original = receipt;
    const controller = new AbortController();
    detailsController = controller;
    loadingDetails = true;
    detailsError = false;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/receipts/serbia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: original.url }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Receipt details unavailable');
      const details: ReceiptDetails = await response.json();
      if (!destroyed && receipt === original) receipt = { ...original, details };
    } catch {
      if (!destroyed && detailsController === controller && receipt === original) detailsError = true;
    } finally {
      clearTimeout(timeout);
      if (detailsController === controller) loadingDetails = false;
    }
  };

  const readPixels = async (source: HTMLImageElement | HTMLVideoElement, width: number, height: number) => {
    const jsQR = await decoder();
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1800 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(pixels.data, pixels.width, pixels.height)?.data;
  };

  const startCamera = async () => {
    stopCamera();
    receipt = null;
    error = null;
    const current = revision;
    if (!navigator.mediaDevices?.getUserMedia) {
      error = 'receipts.camera_failed';
      return;
    }
    startingCamera = true;
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (destroyed || current !== revision) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = media;
      video.srcObject = media;
      await video.play();
      if (destroyed || current !== revision) return;
      camera = true;
      startingCamera = false;
      const scan = async () => {
        if (destroyed || current !== revision) return;
        try {
          if (video.readyState >= 2) {
            const value = await readPixels(video, video.videoWidth, video.videoHeight);
            if (destroyed || current !== revision) return;
            if (value) {
              stopCamera();
              readReceipt(value);
              return;
            }
          }
          timer = setTimeout(() => void scan(), 250);
        } catch {
          if (destroyed || current !== revision) return;
          stopCamera();
          error = 'receipts.camera_failed';
        }
      };
      void scan();
    } catch {
      if (destroyed || current !== revision) return;
      stopCamera();
      error = 'receipts.camera_failed';
    }
  };

  const readPhoto = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    stopCamera();
    const current = revision;
    receipt = null;
    error = null;
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) {
      error = 'receipts.photo_failed';
      input.value = '';
      return;
    }
    busy = true;
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (destroyed || current !== revision) return;
      const value = await readPixels(image, image.naturalWidth, image.naturalHeight);
      if (destroyed || current !== revision) return;
      if (value) readReceipt(value);
      else error = 'receipts.no_qr';
    } catch {
      if (!destroyed && current === revision) error = 'receipts.photo_failed';
    } finally {
      URL.revokeObjectURL(url);
      busy = false;
      input.value = '';
    }
  };

  const choosePhoto = () => {
    stopCamera();
    photoInput.click();
  };

  const readText = () => {
    stopCamera();
    textMode = true;
  };

  const backToQr = async () => {
    textMode = false;
    await tick();
    if (!destroyed) void startCamera();
  };
</script>

<svelte:document on:visibilitychange={() => document.hidden && stopCamera()} />

<Modal bind:opened header={$translate(textMode ? 'receipts.ocr.title' : 'receipts.scan')} width={24}>
  <div class="flex-col gap-1" data-testId="ReceiptScanner">
    {#if textMode}
      <ReceiptTextReader onBack={backToQr} />
    {:else if !receipt}
      <p class="hint">{$translate('receipts.hint')}</p>
      <div class="camera-preview" data-testId="ReceiptCameraPreview">
        <video bind:this={video} class:visible={camera} muted playsinline aria-label={$translate('receipts.camera')}
        ></video>
        {#if busy || startingCamera || error || !camera}
          <div class="camera-status flex-col gap-1">
            {#if busy || startingCamera}<div role="status">{$translate('common.loading')}</div>{/if}
            {#if error}<div role="alert">{$translate(error)}</div>{/if}
            {#if !camera && !startingCamera && !busy}
              <Button color="white" bordered onClick={startCamera}>
                <span class="button-content"
                  ><Icon name="mdi:camera-outline" size={1.25} />{$translate('receipts.camera')}</span
                >
              </Button>
            {/if}
          </div>
        {/if}
      </div>
      <Button color="white" bordered disabled={busy} onClick={choosePhoto}>
        <span class="button-content"><Icon name="mdi:image-outline" size={1.25} />{$translate('receipts.photo')}</span>
      </Button>
      <input
        bind:this={photoInput}
        type="file"
        accept="image/*"
        disabled={busy}
        on:change={readPhoto}
        on:cancel={startCamera}
        aria-label={$translate('receipts.photo')}
        data-testId="ReceiptPhotoInput"
        hidden
      />
      <Input
        label={$translate('receipts.link')}
        bind:value={link}
        name="receipt-link"
        onChange={handleLinkChange}
        clearable
        translate={$translate}
      />
      <Button appearance="link" text={$translate('receipts.ocr.start')} onClick={readText} disabled={busy} />
    {/if}
    {#if receipt}
      <div class="flex-col gap-0.5" data-testId="ReceiptPreview">
        {#if receipt.details?.journal}
          <pre aria-label={$translate('receipts.journal')} data-testId="ReceiptJournal">{receipt.details.journal}</pre>
        {:else}
          <strong
            >{receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} RSD</strong
          >
          <span>{dayjs(receipt.date).tz('Europe/Belgrade').format('DD.MM.YYYY HH:mm')} · Europe/Belgrade</span>
        {/if}
        {#if loadingDetails}
          <p class="hint" role="status">{$translate('receipts.loading_details')}</p>
        {:else if (detailsError || !receipt.details?.itemsAvailable) && !receipt.details?.items.length}
          <div class="flex-col gap-0.25">
            <p class="hint items-error" role="status">
              {$translate('receipts.details_failed')}
            </p>
            <Button
              appearance="link"
              underlined={false}
              onClick={loadDetails}
              text={$translate('receipts.retry_details')}
            />
          </div>
        {/if}
        <Button
          text={$translate('receipts.apply')}
          onClick={() => {
            if (receipt) onApply(receipt);
          }}
        />
      </div>
      <Button color="white" bordered onClick={resetReceipt} text={$translate('receipts.another')} />
    {/if}
    <Button color="white" bordered text={$translate('common.close')} onClick={onClose} />
  </div>
</Modal>

<style>
  p {
    margin: 0;
  }
  .hint {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
  .items-error {
    text-align: center;
  }
  .camera-preview {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 0.75rem;
    background: #000;
  }
  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
  }
  video.visible {
    opacity: 1;
  }
  .camera-status {
    position: absolute;
    inset: 0;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: #fff;
    text-align: center;
  }
  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  pre {
    align-self: center;
    width: max-content;
    max-width: 100%;
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 0.75rem;
  }
</style>
