export function longPress(node: HTMLElement, callback: () => void) {
  let timer: NodeJS.Timeout;

  const handleMousedown = () => {
    timer = setTimeout(() => {
      callback();
    }, 500);
  };

  const handleMouseMove = () => {
    clearTimeout(timer);
  };

  const handleMouseup = () => {
    clearTimeout(timer);
  };

  node.addEventListener('pointerdown', handleMousedown);
  node.addEventListener('pointermove', handleMouseMove);
  node.addEventListener('pointerup', handleMouseup);

  return {
    update: (newCallback: () => void) => {
      callback = newCallback;
    },
    destroy: () => {
      clearTimeout(timer);
      node.removeEventListener('pointerdown', handleMousedown);
      node.removeEventListener('pointermove', handleMouseMove);
      node.removeEventListener('pointerup', handleMouseup);
    },
  };
}
