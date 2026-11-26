/** Keep native dialogs inside the visible area when a mobile keyboard opens or pans it. */
export function fitDialogToViewport(element: HTMLElement) {
  const dialog = element.closest('dialog');
  if (!dialog) return;

  const viewport = window.visualViewport;
  const properties = [
    'position',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'transform',
    'max-height',
    'max-width',
    'box-sizing',
  ];
  const original = properties.map((property) => [property, dialog.style.getPropertyValue(property)] as const);
  const update = () => {
    const height = viewport?.height ?? window.innerHeight;
    const width = viewport?.width ?? window.innerWidth;
    Object.assign(dialog.style, {
      position: 'fixed',
      top: `${(viewport?.offsetTop ?? 0) + height / 2}px`,
      left: `${(viewport?.offsetLeft ?? 0) + width / 2}px`,
      right: 'auto',
      bottom: 'auto',
      margin: '0',
      transform: 'translate(-50%, -50%)',
      maxHeight: `${Math.max(0, height - 32)}px`,
      maxWidth: `${Math.max(0, width - 32)}px`,
      boxSizing: 'border-box',
    });
  };
  update();
  viewport?.addEventListener('resize', update);
  viewport?.addEventListener('scroll', update);
  window.addEventListener('resize', update);

  return {
    destroy() {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      for (const [property, value] of original) {
        if (value) dialog.style.setProperty(property, value);
        else dialog.style.removeProperty(property);
      }
    },
  };
}
