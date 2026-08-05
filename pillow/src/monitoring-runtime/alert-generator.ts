import { nextMonrtId, type MonitoringStore } from "./monitoring-store.js";
import { calculateHealthScore } from "./health-calculator.js";
import type { AnomalyRecord, MonitoringAlert, MonitoredComponent } from "./types.js";

/**
 * Generates alerts from observed anomalies / component state.
 * Critical alerts are NEVER suppressible — suppressCritical=true is rejected by caller.
 */
export class AlertGenerator {
  generateFromAnomalies(
    store: MonitoringStore,
    anomalies: AnomalyRecord[],
    components: MonitoredComponent[],
  ): MonitoringAlert[] {
    const byId = new Map(components.map((c) => [c.monitoringId, c]));
    const generated: MonitoringAlert[] = [];

    for (const anomaly of anomalies) {
      const severity =
        anomaly.anomalyType === "critical_alert" ||
        anomaly.anomalyType === "availability_threshold" ||
        (anomaly.anomalyType === "error_threshold" && anomaly.observedValue >= 5)
          ? "critical"
          : anomaly.anomalyType === "latency_threshold"
            ? "warning"
            : "warning";

      const alert: MonitoringAlert = {
        alertId: nextMonrtId("monrt-alert"),
        monitoringId: anomaly.monitoringId,
        componentId: anomaly.componentId,
        componentType: anomaly.componentType,
        severity,
        messageRef: `msg://monrt/anomaly/${anomaly.anomalyType}/${anomaly.anomalyId}`,
        suppressed: false,
        acknowledged: false,
        timestamp: anomaly.timestamp,
        auditReference: `audit://monrt/alert/${anomaly.anomalyId}`,
        fabricated: false,
        structuralSignalOnly: true,
      };
      store.saveAlert(alert);
      generated.push(alert);

      if (severity === "critical") {
        const component = byId.get(anomaly.monitoringId);
        if (component) {
          const criticalAlertCount = component.criticalAlertCount + 1;
          const health = calculateHealthScore({
            availability: component.availability,
            errorCount: component.errorCount,
            latencyMs: component.latencyMs,
            criticalAlertCount,
            hasEvidence: component.lastSuccessfulHeartbeat != null,
          });
          const updated = store.updateComponent(component.monitoringId, {
            criticalAlertCount,
            currentStatus: health.status,
            healthScore: health.healthScore,
            supportingEvidence: [
              ...component.supportingEvidence,
              `critical_alert:${alert.alertId}`,
            ],
          });
          if (updated) byId.set(updated.monitoringId, updated);
        }
      }
    }

    return generated;
  }

  /**
   * Rejects any attempt to suppress critical alerts.
   * Returns null and does not mutate store when suppressCritical is requested.
   */
  trySuppress(store: MonitoringStore, alertId: string, suppressCritical: boolean): MonitoringAlert | null {
    if (suppressCritical) {
      return null;
    }
    const alerts = store.listAlerts();
    const alert = alerts.find((a) => a.alertId === alertId);
    if (!alert) return null;
    if (alert.severity === "critical") {
      return null;
    }
    return store.removeNonCriticalAlert(alertId);
  }
}
