import { safeCall } from "./evidence-collector.js";
import {
  ALL_RECOVERY_COMPONENT_KEYS,
  RECOVERY_COMPONENT_LABELS,
  RECOVERY_COMPONENT_TYPES,
} from "./paths.js";
import type { RecoveryAuditDependencies } from "./integrations.js";
import type { AllRecoveryComponentKey, DiscoveredRecoveryComponentRecord, RecoveryComponentDiscoveryResult } from "./types.js";

export function handleFor(componentKey: AllRecoveryComponentKey, deps: RecoveryAuditDependencies): object | null | undefined {
  switch (componentKey) {
    case "recovery-runtime":
      return deps.recoveryRuntime;
    case "monitoring-runtime":
      return deps.monitoringRuntime;
    case "queue-runtime":
      return deps.queueRuntime;
    case "mission-runtime":
      return deps.missionRuntime;
    case "audit-runtime":
      return deps.auditRuntime;
    case "executive-reporting-runtime":
      return deps.executiveReportingRuntime;
    case "production-certification-core":
      return deps.productionCertificationCore;
    case "pillow-orchestration-runtime":
      return deps.pillowOrchestrationRuntime;
    case "worker-registry":
      return deps.workerRegistry;
    case "shared-runtime-core":
      return deps.sharedRuntimeCore;
    case "worker-recovery-system":
      return deps.workerRecoverySystem;
    case "recovery-manager":
      return deps.recoveryManager;
    case "rollback-manager":
      return deps.rollbackManager;
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
 * Discovers recovery components strictly from the fixed, evidence-backed
 * `ALL_RECOVERY_COMPONENT_KEYS` catalog by checking injected dependency
 * presence only. A component is never reported "discovered" unless its
 * corresponding handle was actually injected — nothing is invented beyond
 * this catalog.
 */
export function collectRecoveryComponentDiscovery(
  deps: RecoveryAuditDependencies,
): RecoveryComponentDiscoveryResult {
  const components: DiscoveredRecoveryComponentRecord[] = ALL_RECOVERY_COMPONENT_KEYS.map((componentKey) => {
    const handle = handleFor(componentKey, deps);
    const bound = handle != null;
    return {
      componentKey,
      componentName: RECOVERY_COMPONENT_LABELS[componentKey],
      componentType: RECOVERY_COMPONENT_TYPES[componentKey],
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
