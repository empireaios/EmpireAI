/**
 * G6-00 — Production certification framework contract types.
 */

import { z } from "zod";
import type { CertificationDomainId } from "../../../registry/types/certification-registry-types.js";

export const PRODUCTION_CERTIFICATION_VERSION = "g6-00-v1" as const;

export const CERTIFICATION_RESULT_STATES = [
  "pass",
  "pass_with_conditions",
  "warning",
  "blocked",
  "fail",
  "not_applicable",
  "not_tested",
  "unknown",
] as const;

export type CertificationResultState = (typeof CERTIFICATION_RESULT_STATES)[number];

export const CERTIFICATION_GOVERNANCE_STATES = [
  "pending",
  "pillow_validated",
  "pillow_blocked",
  "override_requested",
  "production_eligible",
  "production_blocked",
] as const;

export type CertificationGovernanceState = (typeof CERTIFICATION_GOVERNANCE_STATES)[number];

export const CERTIFICATION_EKLS_OBSERVATION_KINDS = [
  "certification_started",
  "certification_passed",
  "certification_failed",
  "certification_blocked",
  "certification_risk_recorded",
  "certification_evidence_recorded",
  "certification_override_requested",
] as const;

export type CertificationEklsObservationKind =
  (typeof CERTIFICATION_EKLS_OBSERVATION_KINDS)[number];

export const certificationEvidenceSchema = z.object({
  evidenceId: z.string().min(1),
  kind: z.enum(["reference", "metric", "artifact", "registry", "redacted"]),
  summary: z.string().min(1),
  ref: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export type CertificationEvidence = z.infer<typeof certificationEvidenceSchema>;

export const certificationBlockerSchema = z.object({
  blockerId: z.string().min(1),
  checkId: z.string().min(1),
  domain: z.string().min(1),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  message: z.string().min(1),
  overrideEligible: z.boolean(),
});

export type CertificationBlocker = z.infer<typeof certificationBlockerSchema>;

export const certificationRiskSchema = z.object({
  riskId: z.string().min(1),
  checkId: z.string().min(1),
  domain: z.string().min(1),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  summary: z.string().min(1),
  mitigation: z.string().optional(),
});

export type CertificationRisk = z.infer<typeof certificationRiskSchema>;

export const certificationCheckResultSchema = z.object({
  certificationId: z.string().min(1),
  domain: z.string().min(1),
  checkId: z.string().min(1),
  checkName: z.string().min(1),
  scope: z.string().min(1),
  status: z.enum(CERTIFICATION_RESULT_STATES),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  evidence: z.array(certificationEvidenceSchema),
  blockers: z.array(certificationBlockerSchema),
  risks: z.array(certificationRiskSchema),
  recommendations: z.array(z.string()),
  owner: z.string().min(1),
  timestamp: z.string().min(1),
  correlationId: z.string().min(1),
  governanceState: z.enum(CERTIFICATION_GOVERNANCE_STATES),
  score: z.number().min(0).max(100),
});

export type CertificationCheckResult = z.infer<typeof certificationCheckResultSchema>;

export type CertificationDomainResult = {
  domainId: CertificationDomainId;
  domainName: string;
  status: CertificationResultState;
  score: number;
  checks: CertificationCheckResult[];
  blockers: CertificationBlocker[];
  risks: CertificationRisk[];
};

export type CertificationRunResult = {
  runId: string;
  correlationId: string;
  startedAt: string;
  completedAt: string;
  overallStatus: CertificationResultState;
  overallScore: number;
  productionEligible: boolean;
  domains: CertificationDomainResult[];
  blockers: CertificationBlocker[];
  risks: CertificationRisk[];
  governanceState: CertificationGovernanceState;
  discoverySource: "REG-CERTIFICATION-DOMAIN|REG-CERTIFICATION-CHECK|REG-CERTIFICATION-GATE";
};

export type CertificationOverview = {
  frameworkVersion: typeof PRODUCTION_CERTIFICATION_VERSION;
  domainCount: number;
  checkCount: number;
  gateCount: number;
  lastRunId?: string;
  lastOverallStatus?: CertificationResultState;
  productionEligible: boolean;
  generatedAt: string;
};

export type CertificationGateModel = {
  gateId: string;
  domainId: CertificationDomainId;
  checkIds: string[];
  requiredForProduction: boolean;
  gateOrder: number;
};
