import { nextMonrtId, type MonitoringStore } from "./monitoring-store.js";
import type { AnomalyRecord, MonitoredComponent } from "./types.js";

export type AnomalyThresholds = {
  errorCountThreshold: number;
  latencyMsThreshold: number;
  availabilityThreshold: number;
};

/**
 * Detects anomalies from stored evidence against deterministic thresholds.
 * Never fabricates anomaly signals — only observed component metrics.
 */
export class AnomalyDetector {
  detect(
    store: MonitoringStore,
    components: MonitoredComponent[],
    thresholds: AnomalyThresholds,
  ): AnomalyRecord[] {
    const now = new Date().toISOString();
    const detected: AnomalyRecord[] = [];

    for (const component of components) {
      // Skip components with no heartbeat evidence — absence is standby/unknown, not anomaly.
      if (component.lastSuccessfulHeartbeat == null && component.supportingEvidence.every((e) =>
        e.startsWith("registered:"),
      )) {
        continue;
      }

      if (component.errorCount >= thresholds.errorCountThreshold) {
        const anomaly = this.build(
          component,
          "error_threshold",
          component.errorCount,
          thresholds.errorCountThreshold,
          now,
        );
        store.saveAnomaly(anomaly);
        detected.push(anomaly);
      }

      if (component.latencyMs >= thresholds.latencyMsThreshold) {
        const anomaly = this.build(
          component,
          "latency_threshold",
          component.latencyMs,
          thresholds.latencyMsThreshold,
          now,
        );
        store.saveAnomaly(anomaly);
        detected.push(anomaly);
      }

      if (
        component.lastSuccessfulHeartbeat != null &&
        component.availability < thresholds.availabilityThreshold
      ) {
        const anomaly = this.build(
          component,
          "availability_threshold",
          component.availability,
          thresholds.availabilityThreshold,
          now,
        );
        store.saveAnomaly(anomaly);
        detected.push(anomaly);
      }

      if (component.criticalAlertCount > 0) {
        const anomaly = this.build(
          component,
          "critical_alert",
          component.criticalAlertCount,
          0,
          now,
        );
        store.saveAnomaly(anomaly);
        detected.push(anomaly);
      }
    }

    return detected;
  }

  private build(
    component: MonitoredComponent,
    anomalyType: AnomalyRecord["anomalyType"],
    observedValue: number,
    thresholdValue: number,
    timestamp: string,
  ): AnomalyRecord {
    return {
      anomalyId: nextMonrtId("monrt-anom"),
      monitoringId: component.monitoringId,
      componentId: component.componentId,
      componentType: component.componentType,
      anomalyType,
      observedValue,
      thresholdValue,
      timestamp,
      auditReference: `audit://monrt/anomaly/${component.monitoringId}/${anomalyType}`,
      fabricated: false,
      structuralSignalOnly: true,
    };
  }
}
