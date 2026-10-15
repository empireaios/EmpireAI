/**
 * Subscribe to a read on mount and, optionally, to periodic refreshes.
 * The initial read is a cancellable scheduler callback, just like subsequent
 * polls. Strict Mode cleanup can cancel it before it starts; effects do not
 * synchronously cascade loading/error state updates into another render.
 * This does not cancel an already-started read or change its error handling.
 */
export function subscribeRead(read: () => void | Promise<unknown>, intervalMs?: number) {
  const initial = setTimeout(() => { void read(); }, 0);
  const interval = intervalMs && intervalMs > 0
    ? setInterval(() => { void read(); }, intervalMs)
    : undefined;
  return () => {
    clearTimeout(initial);
    if (interval !== undefined) clearInterval(interval);
  };
}
