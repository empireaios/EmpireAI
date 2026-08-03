import type { EmpireIntelligenceFrameworkConfiguration } from "./configuration.js";
import type { EmpireIntelligenceFrameworkHealthReport, EmpireIntelligenceFrameworkRecord } from "./types.js";
export class HealthMonitor {
  buildReport(config: EmpireIntelligenceFrameworkConfiguration, records: EmpireIntelligenceFrameworkRecord[]): EmpireIntelligenceFrameworkHealthReport {
    const active = records.filter((r) => r.operationalState === "active").length;
    const failed = records.filter((r) => r.healthStatus === "failed").length;
    return { status: failed ? "degraded" : "healthy", healthScore: failed ? 65 : 100, frameworkEnabled: config.enabled,
      registeredModules: records.length, activeModules: active, notes: failed ? ["Failed module health requires recovery"] : ["Framework safeguards enforced"] };
  }
}
