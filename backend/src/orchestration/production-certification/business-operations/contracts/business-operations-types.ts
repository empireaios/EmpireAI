/**
 * G6-05 — Business operations certification contract types.
 */

import { z } from "zod";

export const BUSINESS_OPERATIONS_CERTIFICATION_VERSION = "g6-05-v1" as const;

export const BUSINESS_OPERATIONS_EKLS_KINDS = [
  "business_scan_completed",
  "business_failure",
  "business_warning",
  "business_recovered",
  "business_certified",
] as const;

export type BusinessOperationsEklsKind = (typeof BUSINESS_OPERATIONS_EKLS_KINDS)[number];

export const BUSINESS_OPERATIONS_RESULT_STATES = [
  "ready",
  "ready_with_conditions",
  "warning",
  "blocked",
  "not_ready",
  "unknown",
] as const;

export type BusinessOperationsResultState = (typeof BUSINESS_OPERATIONS_RESULT_STATES)[number];

export type BusinessFinding = {
  findingId: string;
  ruleId: string;
  ruleKind: string;
  businessDomain: string;
  serviceId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type BusinessDependencyEntry = {
  dependencyId: string;
  businessDomain: string;
  satisfied: boolean;
  signalRef: string;
};

export type BusinessRiskEntry = {
  riskId: string;
  ruleId: string;
  businessDomain: string;
  severity: BusinessFinding["severity"];
  summary: string;
  mitigation?: string;
};

export type CommerceHealthSummary = {
  marketplaceReady: boolean;
  supplierReady: boolean;
  storefrontReady: boolean;
  paymentReady: boolean;
  logisticsReady: boolean;
};

export type BusinessOperationsScanResult = {
  scanId: string;
  correlationId: string;
  status: BusinessOperationsResultState;
  executiveScore: number;
  failures: BusinessFinding[];
  warnings: BusinessFinding[];
  dependencies: BusinessDependencyEntry[];
  riskRegister: BusinessRiskEntry[];
  executiveRecommendations: string[];
  commerceHealth: CommerceHealthSummary;
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-BUSINESS";
};

export type BusinessOperationsOverview = {
  frameworkVersion: typeof BUSINESS_OPERATIONS_CERTIFICATION_VERSION;
  ruleCount: number;
  businessDomainCount: number;
  lastScanId?: string;
  lastStatus?: BusinessOperationsResultState;
  generatedAt: string;
};

export const businessOperationsPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  validatorKind: z.enum(["business", "marketplace", "supplier", "analytics", "commerce"]),
  pillowGovernance: z.literal(true),
});

export type BusinessOperationsPluginManifest = z.infer<typeof businessOperationsPluginManifestSchema>;

export function mapBusinessStatusToCertification(
  status: BusinessOperationsResultState,
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
