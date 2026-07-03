/**
 * G6-02 — Security & governance certification contract types.
 */

import { z } from "zod";

export const SECURITY_GOVERNANCE_CERTIFICATION_VERSION = "g6-02-v1" as const;

export const SECURITY_GOVERNANCE_EKLS_KINDS = [
  "security_scan_completed",
  "governance_scan_completed",
  "security_violation",
  "credential_exposure_detected",
  "workspace_violation",
  "plugin_violation",
  "security_certified",
] as const;

export type SecurityGovernanceEklsKind = (typeof SECURITY_GOVERNANCE_EKLS_KINDS)[number];

export const SECURITY_GOVERNANCE_RESULT_STATES = [
  "pass",
  "pass_with_conditions",
  "warning",
  "blocked",
  "fail",
] as const;

export type SecurityGovernanceResultState = (typeof SECURITY_GOVERNANCE_RESULT_STATES)[number];

export type SecurityGovernanceViolation = {
  violationId: string;
  ruleId: string;
  ruleKind: string;
  securityDomain: string;
  boundaryId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type SecurityRiskEntry = {
  riskId: string;
  ruleId: string;
  securityDomain: string;
  severity: SecurityGovernanceViolation["severity"];
  summary: string;
  mitigation?: string;
};

export type SecurityGovernanceScanResult = {
  scanId: string;
  correlationId: string;
  scanType: "security" | "governance" | "combined";
  status: SecurityGovernanceResultState;
  score: number;
  securityFindings: SecurityGovernanceViolation[];
  governanceFindings: SecurityGovernanceViolation[];
  credentialExposures: SecurityGovernanceViolation[];
  workspaceViolations: SecurityGovernanceViolation[];
  pluginViolations: SecurityGovernanceViolation[];
  riskRegister: SecurityRiskEntry[];
  executiveRecommendations: string[];
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-SECURITY";
};

export type SecurityGovernanceOverview = {
  frameworkVersion: typeof SECURITY_GOVERNANCE_CERTIFICATION_VERSION;
  ruleCount: number;
  securityDomainCount: number;
  lastScanId?: string;
  lastStatus?: SecurityGovernanceResultState;
  generatedAt: string;
};

export const securityGovernancePluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  validatorKind: z.enum(["security", "governance", "risk_analyser", "credential", "workspace"]),
  pillowGovernance: z.literal(true),
});

export type SecurityGovernancePluginManifest = z.infer<typeof securityGovernancePluginManifestSchema>;
