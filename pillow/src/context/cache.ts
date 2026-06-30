import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { OperationalContext } from "./types.js";

interface CacheEntry {
  fingerprint: string;
  context: OperationalContext;
  cachedAt: number;
}

/** Temporary runtime cache — not permanent memory (PILLOW-004). */
export class ContextCache {
  private entries = new Map<string, CacheEntry>();

  get(key: string, fingerprint: string): OperationalContext | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.fingerprint !== fingerprint) {
      this.entries.delete(key);
      return null;
    }
    return {
      ...entry.context,
      manifest: { ...entry.context.manifest, cached: true },
    };
  }

  set(key: string, fingerprint: string, context: OperationalContext): void {
    this.entries.set(key, {
      fingerprint,
      context: { ...context, manifest: { ...context.manifest, cached: false } },
      cachedAt: Date.now(),
    });
  }

  invalidateAll(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

/** Fingerprint from bootstrap artifact metadata — invalidates on repo change. */
export function buildRepositoryFingerprint(
  bootstrap: EmpireBootstrapContext,
): string {
  const parts: string[] = [
    bootstrap.repositoryVersion ?? "no-git",
    bootstrap.completedAt,
  ];

  for (const artifact of bootstrap.artifacts) {
    if (artifact.present && artifact.modifiedAt) {
      parts.push(`${artifact.descriptor.id}:${artifact.modifiedAt}`);
    }
  }

  return parts.join("|");
}

export function cacheKeyForTask(task: string): string {
  return `context:${task}`;
}
