/**
 * G6-07 — Executive operations certification contract types.
 */

import { z } from "zod";
import type { ExecutiveOperationsResultState } from "../../../../registry/types/certification-registry-types.js";
import { EXECUTIVE_OPERATIONS_RESULT_STATES } from "../../../../registry/types/certification-registry-types.js";

export const EXECUTIVE_OPERATIONS_CERTIFICATION_VERSION = "g6-07-v1" as const;

export { EXECUTIVE_OPERATIONS_RESULT_STATES as EXECUTIVE_RESULT_STATES };
export type ExecutiveResultState = ExecutiveOperationsResultState;

export const EXECUTIVE_OPERATIONS_EKLS_KINDS = [
  "executive_operations_scan_completed",
  "executive_operations_warning",
  "executive_operations_failure",
  "executive_operations_certified",
  "executive_action_safety_issue",
] as const;

export type ExecutiveOperationsEklsKind = (typeof EXECUTIVE_OPERATIONS_EKLS_KINDS)[number];

export type ExecutiveBlocker = {
  blockerId: string;
  ruleId: string;
  ruleKind: string;
  executiveDomain: string;
  serviceId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type ExecutiveVisibilityEntry = {
  visibilityId: string;
  executiveDomain: string;
  satisfied: boolean;
  signalRef: string;
};

export type ExecutiveRiskEntry = {
  riskId: string;
  ruleId: string;
  executiveDomain: string;
  severity: ExecutiveBlocker["severity"];
  summary: string;
  mitigation?: string;
};

export type CockpitHealthSummary = {
  executiveHomeReady: boolean;
  commandCentreReady: boolean;
  automationCentreReady: boolean;
  approvalQueueVisible: boolean;
};

export type ExecutiveActionSafetySummary = {
  actionSafe: boolean;
  approvalAuthorityVerified: boolean;
  visibilityAuthorityVerified: boolean;
};

export type ExecutiveOperationsScanResult = {
  scanId: string;
  correlationId: string;
  status: ExecutiveResultState;
  executiveScore: number;
  blockers: ExecutiveBlocker[];
  warnings: ExecutiveBlocker[];
  visibility: ExecutiveVisibilityEntry[];
  riskRegister: ExecutiveRiskEntry[];
  executiveRecommendations: string[];
  cockpitHealth: CockpitHealthSummary;
  actionSafety: ExecutiveActionSafetySummary;
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-EXECUTIVE";
};

export type ExecutiveOperationsOverview = {
  frameworkVersion: typeof EXECUTIVE_OPERATIONS_CERTIFICATION_VERSION;
  ruleCount: number;
  executiveDomainCount: number;
  lastScanId?: string;
  lastStatus?: ExecutiveResultState;
  generatedAt: string;
};

export const executiveOperationsPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  validatorKind: z.enum(["executive", "cockpit", "report", "assistant", "approval"]),
  pillowGovernance: z.literal(true),
});

export type ExecutiveOperationsPluginManifest = z.infer<typeof executiveOperationsPluginManifestSchema>;
