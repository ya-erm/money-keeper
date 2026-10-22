import workerPath from 'tesseract.js/dist/worker.min.js?url';
import type { Worker as OcrWorker } from 'tesseract.js';

/** The image stays in this browser; only OCR code and language models are downloaded. */
export const recognizeReceiptText = async (
  image: HTMLCanvasElement,
  signal: AbortSignal,
  onProgress: (progress: number) => void,
): Promise<string> => {
  let worker: OcrWorker | undefined;
  let finished = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectCancelled: (reason: Error) => void;
  const cancelled = new Promise<never>((_, reject) => {
    rejectCancelled = reject;
  });
  const abort = () => {
    void worker?.terminate();
    rejectCancelled(new Error('Recognition cancelled'));
  };
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  try {
    const run = async () => {
      const { createWorker } = await import('tesseract.js');
      if (signal.aborted) throw new Error('Recognition cancelled');
      const pending = createWorker('eng+srp', 1, {
        workerPath,
        workerBlobURL: false,
        logger: ({ status, progress }) => {
          if (!finished && !signal.aborted)
            onProgress(status === 'recognizing text' ? 30 + progress * 70 : progress * 30);
        },
        errorHandler: () => rejectCancelled(new Error('Recognition unavailable')),
      });
      // Initialization can still be downloading when the user closes the dialog.
      worker = await pending;
      if (finished || signal.aborted) {
        await worker.terminate();
        throw new Error('Recognition cancelled');
      }
      const result = await worker.recognize(image, { rotateAuto: true });
      return result.data.text;
    };
    timer = setTimeout(() => {
      void worker?.terminate();
      rejectCancelled(new Error('Recognition timed out'));
    }, 120000);
    return await Promise.race([run(), cancelled]);
  } finally {
    finished = true;
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
    await worker?.terminate();
  }
};
