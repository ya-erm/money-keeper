export function longPress(node: HTMLButtonElement, callback: () => void) {
  let timer: NodeJS.Timeout;

  const handleMousedown = () => {
    timer = setTimeout(() => {
      callback();
    }, 500);
  };

  const handleMouseup = () => {
    clearTimeout(timer);
  };

  node.addEventListener('mousedown', handleMousedown);
  node.addEventListener('mouseup', handleMouseup);

  return {
    update: (newCallback: () => void) => {
      callback = newCallback;
    },
    destroy: () => {
      clearTimeout(timer);
      node.removeEventListener('mousedown', handleMousedown);
      node.removeEventListener('mouseup', handleMouseup);
    },
  };
}
