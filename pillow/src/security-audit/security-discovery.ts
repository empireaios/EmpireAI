import { safeCall } from "./evidence-collector.js";
import {
  SECURITY_COMPONENT_KEYS,
  SECURITY_COMPONENT_LABELS,
  SECURITY_COMPONENT_TYPES,
} from "./paths.js";
import type { SecurityAuditDependencies } from "./integrations.js";
import type { DiscoveredSecurityComponentRecord, SecurityComponentDiscoveryResult } from "./types.js";

export function handleFor(componentKey: string, deps: SecurityAuditDependencies): object | null | undefined {
  switch (componentKey) {
    case "authentication-worker":
      return deps.authenticationWorker;
    case "authorization-worker":
      return deps.authorizationWorker;
    case "authority-matrix":
      return deps.authorityMatrix;
    case "api-runtime":
      return deps.apiRuntime;
    case "audit-runtime":
      return deps.auditRuntime;
    case "monitoring-runtime":
      return deps.monitoringRuntime;
    case "production-certification-core":
      return deps.productionCertificationCore;
    case "executive-reporting-runtime":
      return deps.executiveReportingRuntime;
    case "tool-runtime":
      return deps.toolRuntime;
    case "secret-management":
      /** Structural composite — never a literal injected dependency; custodian is the Authentication Worker. */
      return deps.authenticationWorker;
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
 * Discovers security components strictly from the fixed, evidence-backed
 * `SECURITY_COMPONENT_KEYS` catalog by checking injected dependency
 * presence only. A component is never reported "discovered" unless its
 * corresponding handle was actually injected — nothing is invented beyond
 * this catalog.
 */
export function collectSecurityComponentDiscovery(
  deps: SecurityAuditDependencies,
): SecurityComponentDiscoveryResult {
  const components: DiscoveredSecurityComponentRecord[] = SECURITY_COMPONENT_KEYS.map((componentKey) => {
    const handle = handleFor(componentKey, deps);
    const bound = handle != null;
    return {
      componentKey,
      componentName: SECURITY_COMPONENT_LABELS[componentKey],
      componentType: SECURITY_COMPONENT_TYPES[componentKey],
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
