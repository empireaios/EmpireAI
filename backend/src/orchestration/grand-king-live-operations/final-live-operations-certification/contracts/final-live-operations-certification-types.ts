/**
 * G7-10 — Final live operations certification contract types.
 */

import { z } from "zod";
import type { LiveCertificationDomainId, LiveLaunchOutcome } from "../../../../registry/types/live-operations-registry-types.js";
import type { CertificationResultState } from "../../../production-certification/contracts/production-certification-types.js";
import { LIVE_CERTIFICATION_DOMAIN_IDS, LIVE_LAUNCH_OUTCOMES } from "../../../../registry/types/live-operations-registry-types.js";

export const FINAL_LIVE_OPERATIONS_CERTIFICATION_VERSION = "g7-10-v1" as const;

export { LIVE_LAUNCH_OUTCOMES, LIVE_CERTIFICATION_DOMAIN_IDS };
export type { LiveLaunchOutcome, LiveCertificationDomainId };

export const FINAL_LIVE_LAUNCH_EKLS_KINDS = [
  "live_launch_started",
  "live_launch_completed",
  "version1_launched",
  "launch_blocked",
  "launch_failed",
  "grand_king_launch_certified",
  "operational_learning_recorded",
] as const;

export type FinalLiveLaunchEklsKind = (typeof FINAL_LIVE_LAUNCH_EKLS_KINDS)[number];

export type FinalLiveLaunchEvidence = {
  evidenceId: string;
  kind: "artifact" | "reference" | "scan" | "redacted";
  summary: string;
  ref?: string;
};

export type FinalLiveLaunchBlocker = {
  blockerId: string;
  domainId: string;
  domainLabel: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
  overrideEligible?: boolean;
};

export type FinalLiveLaunchRisk = {
  riskId: string;
  domainId: string;
  severity: FinalLiveLaunchBlocker["severity"];
  summary: string;
  mitigation?: string;
};

export type ValidatedLiveDomainResult = {
  domainId: string;
  domainLabel: string;
  missionRef: string;
  status: CertificationResultState;
  score: number;
  evidenceRefs: string[];
};

/** G7-10 — Final live operations certification record contract. */
export type FinalLiveOperationsCertificationRecord = {
  certificationId: string;
  programmeId: "G7";
  workspaceId: string;
  launchStatus: LiveLaunchOutcome;
  liveEligibility: boolean;
  conditions: string[];
  blockers: FinalLiveLaunchBlocker[];
  risks: FinalLiveLaunchRisk[];
  recommendations: string[];
  validatedDomains: ValidatedLiveDomainResult[];
  failedDomains: string[];
  warningDomains: string[];
  requiredActions: string[];
  optionalActions: string[];
  overallEmpireHealth: number;
  launchDecision: string;
  evidence: FinalLiveLaunchEvidence[];
  createdAt: string;
  completedAt: string;
  correlationId: string;
  governanceState: string;
  grandKingReadiness: GrandKingLaunchReadinessSummary;
};

export type GrandKingLaunchReadinessSummary = {
  ready: boolean;
  score: number;
  blockers: FinalLiveLaunchBlocker[];
  conditions: string[];
  programmeRefsValidated: string[];
};

export type FinalLiveOperationsCertificationRunResult = {
  runId: string;
  correlationId: string;
  record: FinalLiveOperationsCertificationRecord;
  launchScore: number;
  scannedAt: string;
  discoverySource: "REG-LIVE-OPERATIONS-FINAL-CERTIFICATION";
  reports: {
    version1LaunchReport: string;
    liveOperationsSummary: string;
    operationalRiskRegister: FinalLiveLaunchRisk[];
    operationalConditionsRegister: string[];
    launchChecklist: string[];
    empireHealthReport: string;
  };
};

export type FinalLiveOperationsCertificationOverview = {
  frameworkVersion: typeof FINAL_LIVE_OPERATIONS_CERTIFICATION_VERSION;
  domainRuleCount: number;
  missionAuditCount: number;
  lastRunId?: string;
  lastLaunchStatus?: LiveLaunchOutcome;
  generatedAt: string;
};

export const finalLiveLaunchPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["validator", "evidence_collector", "readiness_evaluator", "health_evaluator"]),
  pillowGovernance: z.literal(true),
});

export type FinalLiveLaunchPluginManifest = z.infer<typeof finalLiveLaunchPluginManifestSchema>;

export const G7_MISSION_AUDIT_REFS: ReadonlyArray<{
  missionId: string;
  artifactRef: string;
  domainId: LiveCertificationDomainId;
}> = [
  { missionId: "G7-00", artifactRef: "artifacts/g7-00-grand-king-live-operations-framework-executive-audit.md", domainId: "operational_evidence" },
  { missionId: "G7-01", artifactRef: "artifacts/g7-01-grand-king-production-workspace-executive-audit.md", domainId: "grand_king_workspace" },
  { missionId: "G7-02", artifactRef: "artifacts/g7-02-grand-king-commerce-operations-executive-audit.md", domainId: "commerce_operations" },
  { missionId: "G7-03", artifactRef: "artifacts/g7-03-grand-king-business-automation-operations-executive-audit.md", domainId: "automation_operations" },
  { missionId: "G7-04", artifactRef: "artifacts/g7-04-grand-king-executive-decision-centre-executive-audit.md", domainId: "executive_operations" },
  { missionId: "G7-05", artifactRef: "artifacts/g7-05-grand-king-revenue-financial-operations-executive-audit.md", domainId: "financial_operations" },
  { missionId: "G7-06", artifactRef: "artifacts/g7-06-grand-king-continuous-intelligence-optimization-executive-audit.md", domainId: "continuous_optimization" },
  { missionId: "G7-07", artifactRef: "artifacts/g7-07-grand-king-autonomous-operations-executive-audit.md", domainId: "autonomous_operations" },
  { missionId: "G7-08", artifactRef: "artifacts/g7-08-grand-king-self-healing-operations-executive-audit.md", domainId: "self_healing_operations" },
  { missionId: "G7-09", artifactRef: "artifacts/g7-09-grand-king-operational-intelligence-executive-audit.md", domainId: "operational_intelligence" },
];

export function redactLiveLaunchSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("sk_live") ||
      lower.includes("api_key") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("credential") ||
      lower.includes("pii")
    ) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactLiveLaunchSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactLiveLaunchSecrets(entry),
      ]),
    );
  }
  return value;
}
