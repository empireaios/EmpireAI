/**
 * G6-10 — Final production readiness certification contract types.
 */

import { z } from "zod";
import type { CertificationDomainId } from "../../../../registry/types/certification-registry-types.js";
import type { CertificationResultState } from "../../contracts/production-certification-types.js";

export const FINAL_PRODUCTION_READINESS_CERTIFICATION_VERSION = "g6-10-v1" as const;

export const FINAL_CERTIFICATION_OUTCOMES = [
  "PRODUCTION_READY",
  "PRODUCTION_READY_WITH_CONDITIONS",
  "BLOCKED",
  "FAILED",
  "UNKNOWN",
] as const;

export type FinalCertificationOutcome = (typeof FINAL_CERTIFICATION_OUTCOMES)[number];

export const FINAL_READINESS_EKLS_KINDS = [
  "final_certification_started",
  "final_certification_completed",
  "production_ready",
  "production_ready_with_conditions",
  "production_blocked",
  "production_failed",
  "grand_king_readiness_recorded",
] as const;

export type FinalReadinessEklsKind = (typeof FINAL_READINESS_EKLS_KINDS)[number];

export type FinalReadinessEvidence = {
  evidenceId: string;
  kind: "artifact" | "reference" | "scan" | "redacted";
  summary: string;
  ref?: string;
};

export type FinalReadinessBlocker = {
  blockerId: string;
  domainId: string;
  domainLabel: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
  overrideEligible?: boolean;
};

export type FinalReadinessRisk = {
  riskId: string;
  domainId: string;
  severity: FinalReadinessBlocker["severity"];
  summary: string;
  mitigation?: string;
};

export type ValidatedDomainResult = {
  domainId: string;
  domainLabel: string;
  missionRef: string;
  status: CertificationResultState;
  score: number;
  evidenceRefs: string[];
};

/** G6-10 — Final readiness record contract. */
export type FinalProductionReadinessRecord = {
  certificationId: string;
  programmeId: "G6";
  certificationStatus: FinalCertificationOutcome;
  productionEligibility: boolean;
  conditions: string[];
  blockers: FinalReadinessBlocker[];
  risks: FinalReadinessRisk[];
  evidence: FinalReadinessEvidence[];
  recommendations: string[];
  validatedDomains: ValidatedDomainResult[];
  failedDomains: string[];
  warningDomains: string[];
  requiredActions: string[];
  optionalActions: string[];
  timestamp: string;
  correlationId: string;
  governanceState: string;
  grandKingReadiness: GrandKingReadinessSummary;
};

export type GrandKingReadinessSummary = {
  ready: boolean;
  score: number;
  blockers: FinalReadinessBlocker[];
  conditions: string[];
  programmeRefsValidated: string[];
};

export type FinalProductionReadinessRunResult = {
  runId: string;
  correlationId: string;
  record: FinalProductionReadinessRecord;
  readinessScore: number;
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-FINAL-READINESS";
  reports: {
    finalProductionReadinessReport: string;
    g6CompletionSummary: string;
    g6RiskRegister: FinalReadinessRisk[];
    g6BlockerRegister: FinalReadinessBlocker[];
    grandKingReadinessSummary: GrandKingReadinessSummary;
    productionConditionsSummary: string[];
  };
};

export type FinalProductionReadinessOverview = {
  frameworkVersion: typeof FINAL_PRODUCTION_READINESS_CERTIFICATION_VERSION;
  domainRuleCount: number;
  missionAuditCount: number;
  lastRunId?: string;
  lastCertificationStatus?: FinalCertificationOutcome;
  generatedAt: string;
};

export const finalReadinessPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["validator", "evidence_collector", "readiness_evaluator"]),
  pillowGovernance: z.literal(true),
});

export type FinalReadinessPluginManifest = z.infer<typeof finalReadinessPluginManifestSchema>;

export const G6_MISSION_AUDIT_REFS: ReadonlyArray<{
  missionId: string;
  artifactRef: string;
  domainId: CertificationDomainId;
}> = [
  { missionId: "G6-00", artifactRef: "artifacts/g6-00-production-certification-framework-executive-audit.md", domainId: "registry_compliance" },
  { missionId: "G6-01", artifactRef: "artifacts/g6-01-platform-integrity-certification-executive-audit.md", domainId: "platform_integrity" },
  { missionId: "G6-02", artifactRef: "artifacts/g6-02-security-governance-certification-executive-audit.md", domainId: "security" },
  { missionId: "G6-03", artifactRef: "artifacts/g6-03-infrastructure-deployment-certification-executive-audit.md", domainId: "production_deployment" },
  { missionId: "G6-04", artifactRef: "artifacts/g6-04-operational-readiness-certification-executive-audit.md", domainId: "operational_readiness" },
  { missionId: "G6-05", artifactRef: "artifacts/g6-05-business-operations-certification-executive-audit.md", domainId: "business_operations" },
  { missionId: "G6-06", artifactRef: "artifacts/g6-06-performance-scalability-resilience-certification-executive-audit.md", domainId: "performance_scalability_resilience" },
  { missionId: "G6-07", artifactRef: "artifacts/g6-07-executive-operations-certification-executive-audit.md", domainId: "executive_operations" },
  { missionId: "G6-08", artifactRef: "artifacts/g6-08-failure-recovery-incident-certification-executive-audit.md", domainId: "failure_recovery_incident" },
  { missionId: "G6-09", artifactRef: "artifacts/g6-09-production-simulation-certification-executive-audit.md", domainId: "production_simulation" },
];
