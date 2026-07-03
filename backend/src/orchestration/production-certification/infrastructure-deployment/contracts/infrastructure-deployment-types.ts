/**
 * G6-03 — Infrastructure & deployment certification contract types.
 */

import { z } from "zod";

export const INFRASTRUCTURE_DEPLOYMENT_CERTIFICATION_VERSION = "g6-03-v1" as const;

export const INFRASTRUCTURE_DEPLOYMENT_EKLS_KINDS = [
  "deployment_scan_completed",
  "deployment_failure",
  "deployment_risk",
  "deployment_recovery",
  "deployment_certified",
] as const;

export type InfrastructureDeploymentEklsKind = (typeof INFRASTRUCTURE_DEPLOYMENT_EKLS_KINDS)[number];

export const INFRASTRUCTURE_DEPLOYMENT_RESULT_STATES = [
  "pass",
  "pass_with_conditions",
  "warning",
  "blocked",
  "fail",
] as const;

export type InfrastructureDeploymentResultState = (typeof INFRASTRUCTURE_DEPLOYMENT_RESULT_STATES)[number];

export type InfrastructureDeploymentViolation = {
  violationId: string;
  ruleId: string;
  ruleKind: string;
  infrastructureDomain: string;
  serviceId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type ServiceHealthEntry = {
  serviceId: string;
  infrastructureDomain: string;
  status: "healthy" | "degraded" | "unavailable" | "unknown";
  signalCount: number;
  passedSignals: number;
};

export type DeploymentRiskEntry = {
  riskId: string;
  ruleId: string;
  infrastructureDomain: string;
  severity: InfrastructureDeploymentViolation["severity"];
  summary: string;
  mitigation?: string;
};

export type InfrastructureDeploymentScanResult = {
  scanId: string;
  correlationId: string;
  status: InfrastructureDeploymentResultState;
  score: number;
  infrastructureFindings: InfrastructureDeploymentViolation[];
  deploymentFindings: InfrastructureDeploymentViolation[];
  serviceHealth: ServiceHealthEntry[];
  riskRegister: DeploymentRiskEntry[];
  executiveRecommendations: string[];
  readinessSummary: {
    rollbackReady: boolean;
    upgradeReady: boolean;
    capacityReady: boolean;
    recoveryAvailable: boolean;
  };
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-DEPLOYMENT";
};

export type InfrastructureDeploymentOverview = {
  frameworkVersion: typeof INFRASTRUCTURE_DEPLOYMENT_CERTIFICATION_VERSION;
  ruleCount: number;
  infrastructureDomainCount: number;
  lastScanId?: string;
  lastStatus?: InfrastructureDeploymentResultState;
  generatedAt: string;
};

export const infrastructureDeploymentPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  validatorKind: z.enum(["deployment", "hosting", "database", "queue", "storage", "monitoring"]),
  pillowGovernance: z.literal(true),
});

export type InfrastructureDeploymentPluginManifest = z.infer<
  typeof infrastructureDeploymentPluginManifestSchema
>;
