import type { MonitoringStore } from "./monitoring-store.js";

export class MetricsCollector {
  collect(store: MonitoringStore) {
    const components = store.listComponents();
    const alerts = store.listAlerts();
    return {
      totalComponents: components.length,
      totalHeartbeats: store.listHeartbeats().length,
      totalAlerts: alerts.length,
      criticalAlertCount: alerts.filter((a) => a.severity === "critical").length,
      totalAnomalies: store.listAnomalies().length,
      totalReports: store.listReports().length,
      workerCount: components.filter((c) => c.componentType === "worker").length,
      factoryCount: components.filter((c) => c.componentType === "factory").length,
      runtimeCount: components.filter((c) => c.componentType === "runtime_service").length,
      apiCount: components.filter((c) => c.componentType === "api").length,
      queueCount: components.filter((c) => c.componentType === "queue").length,
      missionCount: components.filter((c) => c.componentType === "mission").length,
      toolCount: components.filter((c) => c.componentType === "tool").length,
      averageHealthScore:
        components.length === 0
          ? 50
          : Math.floor(
              components.reduce((sum, c) => sum + c.healthScore, 0) / components.length,
            ),
    };
  }
}
