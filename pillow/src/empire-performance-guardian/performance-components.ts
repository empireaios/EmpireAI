import { EPG_METADATA_VERSION } from "./paths.js";
import type { AnomalyStatus, EmpirePerformanceGuardianInput } from "./types.js";

export class EnterpriseHealthMonitor {
  healthScore(input: EmpirePerformanceGuardianInput, threshold: number): number {
    if (typeof input.healthScore === "number") return Math.max(0, Math.min(100, input.healthScore));
    if (input.degradationHint === true) return Math.max(0, threshold - 20);
    if (input.anomalyHint === "critical") return 25;
    if (input.anomalyHint === "degraded") return Math.max(0, threshold - 10);
    return Math.max(threshold, 80);
  }
}

export class KpiMonitoringEngine {
  resolveCategory(action: string, input: EmpirePerformanceGuardianInput): string {
    return input.performanceCategory?.trim() || action.replaceAll("_", " ");
  }
  kpiSummary(input: EmpirePerformanceGuardianInput, category: string): string {
    return input.kpiSummary?.trim() || `Structural KPI summary for ${category}`;
  }
}

export class PerformanceAnalyticsEngine {
  priorityScore(input: EmpirePerformanceGuardianInput, healthScore: number, anomalyStatus: AnomalyStatus): number {
    if (typeof input.priorityScore === "number") return Math.max(0, Math.min(100, input.priorityScore));
    if (anomalyStatus === "critical") return 95;
    if (anomalyStatus === "degraded") return 75;
    return Math.max(0, Math.min(100, 100 - healthScore + 40));
  }
}

export class AnomalyDetectionEngine {
  status(input: EmpirePerformanceGuardianInput, healthScore: number, threshold: number): AnomalyStatus {
    if (input.anomalyHint) return input.anomalyHint;
    if (input.degradationHint === true) return "degraded";
    if (healthScore < threshold * 0.4) return "critical";
    if (healthScore < threshold) return "degraded";
    if (healthScore < threshold + 10) return "watch";
    return "none";
  }
}

export class PerformanceRecommendationEngine {
  summarize(input: EmpirePerformanceGuardianInput, company: string, category: string): string {
    return input.recommendationSummary?.trim() || `Review performance posture for ${company} (${category})`;
  }
}

export class PerformanceMetadataGenerator {
  version() {
    return EPG_METADATA_VERSION;
  }
  traceId(index: number) {
    return `epg-trace-${Date.now()}-${index}`;
  }
}

export class PerformanceValidator {
  decide(input: EmpirePerformanceGuardianInput): "pass" | "partial" | "fail" {
    if (input.suppressCriticalAlert === true) return "fail";
    if (input.validated === true) return "pass";
    return "partial";
  }
}

export class HealthMonitor {
  health(enabled: boolean) {
    return enabled ? ("healthy" as const) : ("failed" as const);
  }
}

export class RecoveryManager {
  readonly automaticRecoveryEnabled = true as const;
  private attempts = 0;
  attempt() {
    this.attempts += 1;
    return { recovered: true as const, attempt: this.attempts };
  }
  getAttempts() {
    return this.attempts;
  }
}
