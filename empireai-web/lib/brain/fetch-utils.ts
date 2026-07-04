export const SESSION_FETCH_TIMEOUT_MS = 8_000;
export const BRAIN_FETCH_TIMEOUT_MS = 20_000;

export type FetchWithRetryOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  input: RequestInfo,
  init?: FetchWithRetryOptions,
): Promise<Response> {
  const { timeoutMs = BRAIN_FETCH_TIMEOUT_MS, retries: _retries, ...rest } = init ?? {};
  return fetch(input, {
    ...rest,
    signal: rest.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

export async function fetchWithRetry(
  input: RequestInfo,
  init?: FetchWithRetryOptions,
): Promise<Response> {
  const { timeoutMs = BRAIN_FETCH_TIMEOUT_MS, retries = 3, ...rest } = init ?? {};
  const baseDelayMs = 400;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(input, { ...rest, timeoutMs });
      if (response.ok || response.status < 500) {
        return response;
      }

      lastError = new Error(`Request failed (${response.status})`);
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.name === "TimeoutError" || error.name === "AbortError"
            ? new Error("Empire Brain is not responding — check your connection and try again.")
            : error
          : new Error("Network request failed");
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
      }
    }
  }

  throw lastError ?? new Error("Request failed");
}
