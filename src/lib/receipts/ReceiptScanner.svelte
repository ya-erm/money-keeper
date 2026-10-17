<script lang="ts">
  import { onDestroy } from 'svelte';
  import dayjs from 'dayjs';
  import Button from '@ya-erm/svelte-ui/Button';
  import Input from '@ya-erm/svelte-ui/Input';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import { translate } from '$lib/translate';
  import type { Messages } from '$lib/translate/messages';
  import { parseSerbianReceipt, ReceiptError, type SerbianReceipt, type ReceiptDetails } from './serbianReceipt';

  export let onApply: (receipt: SerbianReceipt) => void;
  export let onClose: () => void;

  let opened = true;
  let link = '';
  let receipt: SerbianReceipt | null = null;
  let error: Messages | null = null;
  let busy = false;
  let camera = false;
  let startingCamera = false;
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
    camera = false;
    startingCamera = false;
  };

  onDestroy(() => {
    destroyed = true;
    detailsController?.abort();
    stopCamera();
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

  const resetReceipt = () => {
    stopCamera();
    detailsController?.abort();
    detailsController = null;
    receipt = null;
    link = '';
    error = null;
    detailsError = false;
    loadingDetails = false;
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
</script>

<svelte:document on:visibilitychange={() => document.hidden && stopCamera()} />

<Modal bind:opened header={$translate('receipts.scan')} width={24}>
  <div class="flex-col gap-1" data-testId="ReceiptScanner">
    {#if !receipt}
      <p class="hint">{$translate('receipts.hint')}</p>
      <div class="grid-col-2 gap-1">
        <Button disabled={busy || startingCamera} onClick={camera ? stopCamera : startCamera}>
          <span class="button-content"
            ><Icon name={camera ? 'mdi:stop' : 'mdi:camera-outline'} size={1.25} />
            {$translate(camera ? 'receipts.stop_camera' : 'receipts.camera')}</span
          >
        </Button>
        <Button color="white" bordered disabled={busy || startingCamera || camera} onClick={() => photoInput.click()}>
          <span class="button-content"><Icon name="mdi:image-outline" size={1.25} />{$translate('receipts.photo')}</span
          >
        </Button>
      </div>
      <input
        bind:this={photoInput}
        type="file"
        accept="image/*"
        disabled={busy || startingCamera || camera}
        on:change={readPhoto}
        aria-label={$translate('receipts.photo')}
        data-testId="ReceiptPhotoInput"
        hidden
      />
      <video
        bind:this={video}
        class:visible={camera || startingCamera}
        muted
        playsinline
        aria-label={$translate('receipts.camera')}
      ></video>
      <Input
        label={$translate('receipts.link')}
        bind:value={link}
        name="receipt-link"
        onChange={handleLinkChange}
        clearable
        translate={$translate}
      />
    {/if}
    {#if busy || startingCamera}<div role="status">{$translate('common.loading')}</div>{/if}
    {#if error}<div role="alert">{$translate(error)}</div>{/if}
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
        {:else if detailsError || !receipt.details?.itemsAvailable}
          <div class="flex-col gap-0.25">
            <p class="hint" role="status">
              {$translate(detailsError ? 'receipts.details_failed' : 'receipts.items_unavailable')}
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
  video {
    display: none;
    width: 100%;
    max-height: 16rem;
    border-radius: 0.75rem;
    background: #000;
  }
  video.visible {
    display: block;
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
