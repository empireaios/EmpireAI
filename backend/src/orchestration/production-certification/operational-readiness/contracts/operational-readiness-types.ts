/**
 * G6-04 — Operational readiness certification contract types.
 */

import { z } from "zod";

export const OPERATIONAL_READINESS_CERTIFICATION_VERSION = "g6-04-v1" as const;

export const OPERATIONAL_READINESS_EKLS_KINDS = [
  "operational_scan_completed",
  "operational_blocker_detected",
  "operational_recovered",
  "operational_warning",
  "operational_certified",
] as const;

export type OperationalReadinessEklsKind = (typeof OPERATIONAL_READINESS_EKLS_KINDS)[number];

export const OPERATIONAL_READINESS_RESULT_STATES = [
  "ready",
  "ready_with_conditions",
  "warning",
  "blocked",
  "not_ready",
  "unknown",
] as const;

export type OperationalReadinessResultState = (typeof OPERATIONAL_READINESS_RESULT_STATES)[number];

export type OperationalBlocker = {
  blockerId: string;
  ruleId: string;
  ruleKind: string;
  readinessDomain: string;
  serviceId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type OperationalDependencyEntry = {
  dependencyId: string;
  readinessDomain: string;
  satisfied: boolean;
  signalRef: string;
};

export type OperationalRiskEntry = {
  riskId: string;
  ruleId: string;
  readinessDomain: string;
  severity: OperationalBlocker["severity"];
  summary: string;
  mitigation?: string;
};

export type OperationalReadinessScanResult = {
  scanId: string;
  correlationId: string;
  status: OperationalReadinessResultState;
  score: number;
  blockers: OperationalBlocker[];
  warnings: OperationalBlocker[];
  dependencies: OperationalDependencyEntry[];
  riskRegister: OperationalRiskEntry[];
  executiveRecommendations: string[];
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-OPERATIONAL";
};

export type OperationalReadinessOverview = {
  frameworkVersion: typeof OPERATIONAL_READINESS_CERTIFICATION_VERSION;
  ruleCount: number;
  readinessDomainCount: number;
  lastScanId?: string;
  lastStatus?: OperationalReadinessResultState;
  generatedAt: string;
};

export const operationalReadinessPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  validatorKind: z.enum(["operational", "dependency", "monitoring", "provider", "risk_analyser"]),
  pillowGovernance: z.literal(true),
});

export type OperationalReadinessPluginManifest = z.infer<typeof operationalReadinessPluginManifestSchema>;

export function mapOperationalStatusToCertification(
  status: OperationalReadinessResultState,
): "pass" | "pass_with_conditions" | "warning" | "blocked" | "fail" | "unknown" {
  switch (status) {
    case "ready":
      return "pass";
    case "ready_with_conditions":
      return "pass_with_conditions";
    case "warning":
      return "warning";
    case "blocked":
      return "blocked";
    case "not_ready":
      return "fail";
    default:
      return "unknown";
  }
}
