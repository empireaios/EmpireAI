/** Client cancellation bounds local work; it does not prove provider billing stopped. */
export function parseLLMTimeout(raw: string | undefined): number {
  if (raw === undefined) return 45_000;
  if (!/^\d+$/.test(raw)) throw new Error('Invalid LLM_REQUEST_TIMEOUT_MS');
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > 120_000) throw new Error('LLM_REQUEST_TIMEOUT_MS must be 1..120000');
  return value;
}

export async function withLLMDeadline<T>(invoke: (signal: AbortSignal) => Promise<T>, timeoutMs: number, callerSignal?: AbortSignal): Promise<T> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) throw new Error('Invalid LLM timeout');
  callerSignal?.throwIfAborted();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onCallerAbort: (() => void) | undefined;
  const cancellation = new Promise<never>((_, reject) => {
    const cancel = (reason: unknown) => { controller.abort(reason); reject(reason); };
    timer = setTimeout(() => cancel(new Error(`LLM request timed out after ${timeoutMs}ms`)), timeoutMs);
    onCallerAbort = () => cancel(callerSignal?.reason ?? new Error('LLM request cancelled'));
    callerSignal?.addEventListener('abort', onCallerAbort, { once: true });
  });
  try {
    return await Promise.race([invoke(controller.signal), cancellation]);
  } finally {
    if (timer) clearTimeout(timer);
    if (onCallerAbort) callerSignal?.removeEventListener('abort', onCallerAbort);
  }
}
