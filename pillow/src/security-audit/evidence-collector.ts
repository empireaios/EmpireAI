/** Shared, side-effect-free structural evidence helpers used by discovery and classification. */

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
 * Reads a bound handle's `configuration` via its `getState()` accessor,
 * strictly for presence/flag evidence (e.g. `maskSensitiveValues`,
 * `neverStorePlaintextPasswords`). Never reads or logs actual secret
 * values — only boolean/string configuration flags are consulted.
 */
export function readConfigurationFlags(
  handle: { getState?: () => unknown } | null | undefined,
): Record<string, unknown> | null {
  if (!handle || typeof handle.getState !== "function") return null;
  const state = safeCall(() => handle.getState!());
  if (!state || typeof state !== "object") return null;
  const configuration = (state as { configuration?: unknown }).configuration;
  return configuration && typeof configuration === "object" ? (configuration as Record<string, unknown>) : null;
}

export function configurationFlagTrue(configuration: Record<string, unknown> | null, key: string): boolean {
  return configuration?.[key] === true;
}
