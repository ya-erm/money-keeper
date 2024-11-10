/** Go back via history.back() if history has mre then one items, or call fallback */
export function goBack(fallback: () => void) {
  if (history.length > 1) {
    history.back();
  } else {
    fallback();
  }
}
