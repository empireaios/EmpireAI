/** Shared, side-effect-free structural evidence helpers used by discovery, benchmarking, and classification. */

export function safeCall<T>(fn: (() => T) | undefined | null): T | null {
  if (typeof fn !== "function") return null;
  try {
    return fn();
  } catch {
    return null;
  }
}

/** Counts how many of the given method names are present (typeof === "function") on a handle. */
export function countPresentMethods(handle: object | null | undefined, methodNames: string[]): number {
  if (!handle) return 0;
  return methodNames.filter((name) => typeof (handle as Record<string, unknown>)[name] === "function").length;
}

export function hasAllMethods(handle: object | null | undefined, methodNames: string[]): boolean {
  return countPresentMethods(handle, methodNames) === methodNames.length;
}

/**
 * Times a single invocation of a safe, non-mutating, read-only structural
 * probe method (e.g. `listWorkers`, `getCatalog`, `getDashboard`,
 * `checkHealth`, `getState`, `query`, `getCertificationResults`) using
 * `Date.now()` deltas. Never invents a timing — returns `null` when the
 * probe method is absent or throws, and the caller records that as
 * missing/failed evidence rather than fabricating a number.
 */
export function timeSafeProbe(
  handle: object | null | undefined,
  methodName: string,
  args: unknown[] = [],
): { ok: boolean; elapsedMs: number | null; error: string | null } {
  if (!handle || typeof (handle as Record<string, unknown>)[methodName] !== "function") {
    return { ok: false, elapsedMs: null, error: `${methodName} not present on handle` };
  }
  const fn = (handle as Record<string, (...a: unknown[]) => unknown>)[methodName]!;
  const started = Date.now();
  try {
    fn.apply(handle, args);
    return { ok: true, elapsedMs: Date.now() - started, error: null };
  } catch (error) {
    return {
      ok: false,
      elapsedMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Runs `count` concurrent invocations of the same safe probe and measures total wall-clock elapsed time. */
export async function timeConcurrentProbes(
  handle: object | null | undefined,
  methodName: string,
  count: number,
): Promise<{ elapsedMs: number; successCount: number; failureCount: number }> {
  if (!handle || typeof (handle as Record<string, unknown>)[methodName] !== "function") {
    return { elapsedMs: 0, successCount: 0, failureCount: count };
  }
  const fn = (handle as Record<string, (...a: unknown[]) => unknown>)[methodName]!;
  const started = Date.now();
  const results = await Promise.all(
    Array.from({ length: count }, () =>
      Promise.resolve()
        .then(() => fn.apply(handle, []))
        .then(
          () => true,
          () => false,
        ),
    ),
  );
  const successCount = results.filter(Boolean).length;
  return { elapsedMs: Date.now() - started, successCount, failureCount: results.length - successCount };
}
