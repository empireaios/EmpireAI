import type { SharedRuntimeCoreHandle } from "./integrations.js";
import type { DiscoveredFactoryRecord, FactoryDiscoveryResult } from "./types.js";

function safeCall<T>(fn: (() => T) | undefined | null): T | null {
  if (typeof fn !== "function") return null;
  try {
    return fn();
  } catch {
    return null;
  }
}

/**
 * Extracts the raw factory list from an injected Shared Runtime Core handle.
 * Tries `listFactories()` first (direct catalog accessor), then falls back
 * to `getCatalog().factories` and `getTopology().factories` — the two
 * accessors actually exposed by `SharedRuntimeCore`. Never invents a
 * factory list when none of these are present.
 */
function extractFactories(handle: SharedRuntimeCoreHandle | null | undefined): unknown[] | null {
  if (!handle) return null;
  if (typeof handle.listFactories === "function") {
    const result = safeCall(() => handle.listFactories!());
    if (Array.isArray(result)) return result;
  }
  if (typeof handle.getCatalog === "function") {
    const catalog = safeCall(() => handle.getCatalog!());
    if (catalog && Array.isArray(catalog.factories)) return catalog.factories;
  }
  if (typeof handle.getTopology === "function") {
    const topology = safeCall(() => handle.getTopology!());
    if (topology && Array.isArray(topology.factories)) return topology.factories;
  }
  return null;
}

function normalizeFactoryRecord(raw: Record<string, unknown>): DiscoveredFactoryRecord {
  return {
    factoryKey: String(raw.factoryKey ?? ""),
    factoryName: typeof raw.factoryName === "string" ? raw.factoryName : null,
    series: typeof raw.series === "string" ? raw.series : null,
    missionId: typeof raw.missionId === "string" ? raw.missionId : null,
    healthStatus: typeof raw.healthStatus === "string" ? raw.healthStatus : null,
    evidencePresent: typeof raw.evidencePresent === "boolean" ? raw.evidencePresent : null,
  };
}

/**
 * Discovers business factories strictly from an injected Shared Runtime
 * Core handle (`listFactories()` / `getCatalog()` / `getTopology()`).
 * Absence of an injected handle is reported as zero discovered factories —
 * factories are never invented. The `FACTORY_KEYS` catalog in `paths.ts` is
 * a read-only reference duplicate used only to cross-check evidence; it is
 * never itself treated as a discovery source.
 */
export function collectFactoryDiscovery(
  sharedRuntimeCore: SharedRuntimeCoreHandle | null | undefined,
): FactoryDiscoveryResult {
  const sharedRuntimeCoreInjected = sharedRuntimeCore != null;
  const rawFactories = sharedRuntimeCoreInjected ? extractFactories(sharedRuntimeCore) ?? [] : [];
  const factories: DiscoveredFactoryRecord[] = rawFactories
    .map((f) => normalizeFactoryRecord(f as Record<string, unknown>))
    .filter((f) => f.factoryKey.length > 0);

  return {
    discoveredAt: new Date().toISOString(),
    sharedRuntimeCoreInjected,
    discoveredCount: factories.length,
    factories,
    evidence: [
      `sharedRuntimeCoreInjected=${sharedRuntimeCoreInjected}`,
      `discoveredCount=${factories.length}`,
      sharedRuntimeCoreInjected
        ? "discovered from injected sharedRuntimeCore (listFactories/getCatalog/getTopology)"
        : "no sharedRuntimeCore injected — zero factories discovered, none invented",
    ],
  };
}
