/**
 * EA-003 — RegistryLoader cache strategy.
 */

import type { RegistryCachePolicy } from "../types/registry-types.js";

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

export class RegistryCache {
  private readonly store = new Map<string, CacheEntry>();

  get<T>(key: string, policy: RegistryCachePolicy): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (policy !== "immutable" && policy !== "deployment" && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, policy: RegistryCachePolicy, ttlMs: number): void {
    const expiresAt =
      policy === "immutable" || policy === "deployment"
        ? Number.POSITIVE_INFINITY
        : Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  buildKey(parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(":");
  }
}

export const defaultRegistryCache = new RegistryCache();
