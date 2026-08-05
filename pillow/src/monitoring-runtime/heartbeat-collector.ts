import { MONRT_METADATA_VERSION } from "./paths.js";
import { nextMonrtId, type MonitoringStore } from "./monitoring-store.js";
import { calculateHealthScore } from "./health-calculator.js";
import type { HeartbeatRecord, MonitoredComponent, MonrtInput } from "./types.js";

/**
 * Records heartbeats from observed probe evidence only.
 * Updates lastSuccessfulHeartbeat and supportingEvidence — never fabricates health.
 */
export class HeartbeatCollector {
  recordHeartbeat(
    store: MonitoringStore,
    component: MonitoredComponent,
    input: MonrtInput,
  ): { heartbeat: HeartbeatRecord; component: MonitoredComponent } {
    const now = new Date().toISOString();
    const success = input.success !== false;
    const latencyMs = Math.max(0, Math.floor(input.latencyMs ?? 0));
    const errorCountDelta = Math.max(0, Math.floor(input.errorCountDelta ?? (success ? 0 : 1)));
    const warningCountDelta = Math.max(0, Math.floor(input.warningCountDelta ?? 0));
    const availabilitySample = clamp(
      Math.floor(input.availabilitySample ?? (success ? 100 : 0)),
      0,
      100,
    );

    const heartbeat: HeartbeatRecord = {
      heartbeatId: nextMonrtId("monrt-hb"),
      monitoringId: component.monitoringId,
      componentId: component.componentId,
      componentType: component.componentType,
      timestamp: now,
      latencyMs,
      success,
      errorCountDelta,
      warningCountDelta,
      availabilitySample,
      auditReference: input.auditReference ?? `audit://monrt/heartbeat/${component.monitoringId}`,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: MONRT_METADATA_VERSION,
    };
    store.saveHeartbeat(heartbeat);

    const errorCount = component.errorCount + errorCountDelta;
    const warningCount = component.warningCount + warningCountDelta;
    const criticalAlertCount = component.criticalAlertCount;
    // Rolling availability: blend prior with sample when evidence exists.
    const availability = Math.floor((component.availability + availabilitySample) / 2);
    const health = calculateHealthScore({
      availability,
      errorCount,
      latencyMs,
      criticalAlertCount,
      hasEvidence: true,
    });

    const evidence = [
      ...component.supportingEvidence,
      `heartbeat:${heartbeat.heartbeatId}:${success ? "ok" : "fail"}:latency=${latencyMs}`,
    ];

    const updated =
      store.updateComponent(component.monitoringId, {
        currentStatus: health.status,
        healthScore: health.healthScore,
        availability,
        latencyMs,
        errorCount,
        warningCount,
        lastSuccessfulHeartbeat: success ? now : component.lastSuccessfulHeartbeat,
        monitoringTimestamp: now,
        supportingEvidence: evidence,
      }) ?? component;

    return { heartbeat, component: updated };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
