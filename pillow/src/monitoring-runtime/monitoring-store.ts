import type {
  AnomalyRecord,
  HeartbeatRecord,
  MonitoredComponent,
  MonitoringAlert,
  MonitoringRuntimeReport,
} from "./types.js";

let sequence = 0;

export function resetMonrtSequenceForTesting() {
  sequence = 0;
}

export function nextMonrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class MonitoringStore {
  private components = new Map<string, MonitoredComponent>();
  private heartbeats: HeartbeatRecord[] = [];
  private alerts: MonitoringAlert[] = [];
  private anomalies: AnomalyRecord[] = [];
  private reports: MonitoringRuntimeReport[] = [];
  private componentHistory: MonitoredComponent[] = [];
  private alertHistory: MonitoringAlert[] = [];
  private auditTrail: string[] = [];

  saveComponent(component: MonitoredComponent) {
    const snapshot = this.cloneComponent(component);
    this.components.set(component.monitoringId, snapshot);
    this.componentHistory.push(this.cloneComponent(component));
    this.auditTrail.push(`component_saved:${component.monitoringId}@${new Date().toISOString()}`);
    return snapshot;
  }

  getComponent(monitoringId: string) {
    const component = this.components.get(monitoringId);
    return component ? this.cloneComponent(component) : null;
  }

  getComponentByIdentity(componentId: string, componentType: string) {
    const found = [...this.components.values()].find(
      (c) => c.componentId === componentId && c.componentType === componentType,
    );
    return found ? this.cloneComponent(found) : null;
  }

  listComponents() {
    return [...this.components.values()]
      .map((c) => this.cloneComponent(c))
      .sort((a, b) => a.monitoringId.localeCompare(b.monitoringId));
  }

  listComponentsByType(componentType: string) {
    return this.listComponents().filter((c) => c.componentType === componentType);
  }

  /**
   * Update a component. NEVER fabricates health — caller must supply observed evidence fields.
   */
  updateComponent(monitoringId: string, patch: Partial<MonitoredComponent>) {
    const existing = this.components.get(monitoringId);
    if (!existing) return null;
    const updated: MonitoredComponent = {
      ...existing,
      ...patch,
      supportingEvidence: patch.supportingEvidence
        ? [...patch.supportingEvidence]
        : [...existing.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
    this.components.set(monitoringId, updated);
    this.componentHistory.push(this.cloneComponent(updated));
    this.auditTrail.push(`component_updated:${monitoringId}@${new Date().toISOString()}`);
    return this.cloneComponent(updated);
  }

  /** Append-only heartbeat persistence. */
  saveHeartbeat(heartbeat: HeartbeatRecord) {
    const snapshot = this.cloneHeartbeat(heartbeat);
    this.heartbeats.push(snapshot);
    this.auditTrail.push(`heartbeat_saved:${heartbeat.heartbeatId}@${heartbeat.timestamp}`);
    return snapshot;
  }

  listHeartbeats() {
    return this.heartbeats.map((h) => this.cloneHeartbeat(h));
  }

  listHeartbeatsForComponent(monitoringId: string) {
    return this.listHeartbeats().filter((h) => h.monitoringId === monitoringId);
  }

  /**
   * Append-only alert persistence.
   * CRITICAL alerts are NEVER removed or suppressed from the store.
   */
  saveAlert(alert: MonitoringAlert) {
    const snapshot = this.cloneAlert({
      ...alert,
      suppressed: false,
      fabricated: false,
      structuralSignalOnly: true,
    });
    this.alerts.push(snapshot);
    this.alertHistory.push(this.cloneAlert(snapshot));
    this.auditTrail.push(`alert_saved:${alert.alertId}:${alert.severity}@${alert.timestamp}`);
    return snapshot;
  }

  listAlerts() {
    return this.alerts.map((a) => this.cloneAlert(a));
  }

  listCriticalAlerts() {
    return this.listAlerts().filter((a) => a.severity === "critical");
  }

  acknowledgeAlert(alertId: string) {
    const idx = this.alerts.findIndex((a) => a.alertId === alertId);
    if (idx < 0) return null;
    const existing = this.alerts[idx]!;
    // Critical alerts may be acknowledged but NEVER suppressed or removed.
    const updated: MonitoringAlert = {
      ...existing,
      acknowledged: true,
      suppressed: false,
      fabricated: false,
      structuralSignalOnly: true,
    };
    this.alerts[idx] = updated;
    this.alertHistory.push(this.cloneAlert(updated));
    this.auditTrail.push(`alert_acknowledged:${alertId}@${new Date().toISOString()}`);
    return this.cloneAlert(updated);
  }

  /** Intentionally no delete/suppress for critical alerts — history is append-only. */
  removeNonCriticalAlert(alertId: string): MonitoringAlert | null {
    const idx = this.alerts.findIndex((a) => a.alertId === alertId);
    if (idx < 0) return null;
    const existing = this.alerts[idx]!;
    if (existing.severity === "critical") {
      this.auditTrail.push(`alert_remove_rejected_critical:${alertId}`);
      return null;
    }
    // Non-critical may leave active list but remain in alertHistory.
    const [removed] = this.alerts.splice(idx, 1);
    this.auditTrail.push(`alert_removed_non_critical:${alertId}`);
    return removed ? this.cloneAlert(removed) : null;
  }

  saveAnomaly(anomaly: AnomalyRecord) {
    const snapshot = this.cloneAnomaly(anomaly);
    this.anomalies.push(snapshot);
    this.auditTrail.push(`anomaly_saved:${anomaly.anomalyId}@${anomaly.timestamp}`);
    return snapshot;
  }

  listAnomalies() {
    return this.anomalies.map((a) => this.cloneAnomaly(a));
  }

  saveReport(report: MonitoringRuntimeReport) {
    this.reports.push({
      ...report,
      enterpriseHealthSummary: {
        ...report.enterpriseHealthSummary,
        categoryScores: { ...report.enterpriseHealthSummary.categoryScores },
        supportingEvidence: [...report.enterpriseHealthSummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      workerHealth: this.cloneSnapshot(report.workerHealth),
      factoryHealth: this.cloneSnapshot(report.factoryHealth),
      runtimeHealth: this.cloneSnapshot(report.runtimeHealth),
      apiHealth: this.cloneSnapshot(report.apiHealth),
      queueHealth: this.cloneSnapshot(report.queueHealth),
      missionHealth: this.cloneSnapshot(report.missionHealth),
      toolHealth: this.cloneSnapshot(report.toolHealth),
      activeAlerts: report.activeAlerts.map((a) => this.cloneAlert(a)),
      criticalEvents: report.criticalEvents.map((a) => this.cloneAlert(a)),
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }

  getHistory() {
    return {
      components: this.listComponents(),
      componentHistory: this.componentHistory.map((c) => this.cloneComponent(c)),
      heartbeats: this.listHeartbeats(),
      alerts: this.listAlerts(),
      alertHistory: this.alertHistory.map((a) => this.cloneAlert(a)),
      anomalies: this.listAnomalies(),
      reports: this.listReports(),
    };
  }

  private cloneComponent(component: MonitoredComponent): MonitoredComponent {
    return {
      ...component,
      supportingEvidence: [...component.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneHeartbeat(heartbeat: HeartbeatRecord): HeartbeatRecord {
    return {
      ...heartbeat,
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneAlert(alert: MonitoringAlert): MonitoringAlert {
    return {
      ...alert,
      suppressed: false,
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneAnomaly(anomaly: AnomalyRecord): AnomalyRecord {
    return {
      ...anomaly,
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneSnapshot(snapshot: MonitoringRuntimeReport["workerHealth"]) {
    return {
      ...snapshot,
      components: snapshot.components.map((c) => this.cloneComponent(c)),
      supportingEvidence: [...snapshot.supportingEvidence],
      fabricated: false as const,
      structuralSignalOnly: true as const,
    };
  }
}
