import { safeCall } from "./evidence-collector.js";
import {
  PERFORMANCE_COMPONENT_KEYS,
  PERFORMANCE_COMPONENT_LABELS,
  PERFORMANCE_COMPONENT_TYPES,
} from "./paths.js";
import type { PerformanceAuditDependencies } from "./integrations.js";
import type { DiscoveredPerformanceComponentRecord, PerformanceComponentDiscoveryResult } from "./types.js";

export function handleFor(componentKey: string, deps: PerformanceAuditDependencies): object | null | undefined {
  switch (componentKey) {
    case "worker-registry":
      return deps.workerRegistry;
    case "shared-runtime-core":
      return deps.sharedRuntimeCore;
    case "monitoring-runtime":
      return deps.monitoringRuntime;
    case "api-runtime":
      return deps.apiRuntime;
    case "queue-runtime":
      return deps.queueRuntime;
    case "scheduling-runtime":
      return deps.schedulingRuntime;
    case "audit-runtime":
      return deps.auditRuntime;
    case "executive-reporting-runtime":
      return deps.executiveReportingRuntime;
    case "production-certification-core":
      return deps.productionCertificationCore;
    case "pillow-orchestration-runtime":
      return deps.pillowOrchestrationRuntime;
    default:
      return null;
  }
}

function healthStatusFor(handle: { getState?: () => unknown } | null | undefined): string | null {
  if (!handle || typeof handle.getState !== "function") return null;
  const state = safeCall(() => handle.getState!()) as { status?: string; health?: { status?: string } } | null;
  return state?.health?.status ?? state?.status ?? null;
}

/**
 * Discovers performance benchmark targets strictly from the fixed,
 * evidence-backed `PERFORMANCE_COMPONENT_KEYS` catalog by checking
 * injected dependency presence only. A component is never reported
 * "discovered" unless its corresponding handle was actually injected —
 * nothing is invented beyond this catalog.
 */
export function collectPerformanceComponentDiscovery(
  deps: PerformanceAuditDependencies,
): PerformanceComponentDiscoveryResult {
  const components: DiscoveredPerformanceComponentRecord[] = PERFORMANCE_COMPONENT_KEYS.map((componentKey) => {
    const handle = handleFor(componentKey, deps);
    const bound = handle != null;
    return {
      componentKey,
      componentName: PERFORMANCE_COMPONENT_LABELS[componentKey],
      componentType: PERFORMANCE_COMPONENT_TYPES[componentKey],
      bound,
      healthStatus: bound ? healthStatusFor(handle as { getState?: () => unknown }) : null,
      evidencePresent: bound,
    };
  });

  const discoveredCount = components.filter((c) => c.bound).length;

  return {
    discoveredAt: new Date().toISOString(),
    discoveredCount,
    totalCatalogued: components.length,
    components,
    evidence: [
      `discoveredCount=${discoveredCount}/${components.length}`,
      ...components.map((c) => `${c.componentKey}:${c.bound ? "bound" : "unavailable"}`),
    ],
  };
}
