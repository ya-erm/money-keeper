export default function resizeObserver(node: HTMLElement, options: { onResize: (rect: DOMRectReadOnly) => void }) {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      options.onResize(entry.contentRect);
    }
  });

  resizeObserver.observe(node);

  return {
    destroy() {
      resizeObserver.disconnect();
    },
  };
}
