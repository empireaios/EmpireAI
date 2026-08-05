import { MONRT_METADATA_VERSION } from "./paths.js";
import { nextMonrtId, type MonitoringStore } from "./monitoring-store.js";
import { calculateHealthScore } from "./health-calculator.js";
import type { ComponentType, MonitoredComponent, MonrtInput } from "./types.js";

/**
 * Registers monitored components deterministically by componentId + componentType.
 * Seed/register with standby/unknown until heartbeats are recorded — never fabricated healthy.
 */
export class ComponentRegistry {
  registerComponent(store: MonitoringStore, input: MonrtInput): MonitoredComponent {
    const componentId = input.componentId!;
    const componentType = input.componentType as ComponentType;
    const existing = store.getComponentByIdentity(componentId, componentType);
    if (existing) return existing;

    const monitoringId = input.monitoringId ?? nextMonrtId("monrt-cmp");
    const now = new Date().toISOString();
    // No evidence yet — standby with score reflecting absence (50), not fabricated healthy.
    const health = calculateHealthScore({
      availability: 50,
      errorCount: 0,
      latencyMs: 0,
      criticalAlertCount: 0,
      hasEvidence: false,
    });

    const component: MonitoredComponent = {
      monitoringId,
      componentId,
      componentType,
      currentStatus: health.status === "unknown" ? "standby" : health.status,
      healthScore: 50,
      availability: 50,
      latencyMs: 0,
      errorCount: 0,
      warningCount: 0,
      criticalAlertCount: 0,
      lastSuccessfulHeartbeat: null,
      monitoringTimestamp: now,
      supportingEvidence: [`registered:${componentId}:${componentType}:standby_no_evidence`],
      auditReference: input.auditReference ?? `audit://monrt/component/${monitoringId}`,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: MONRT_METADATA_VERSION,
    };

    return store.saveComponent(component);
  }
}
