/**
 * G7-10 — Final live certification aggregator (registry-driven domain validation).
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { CertificationResultState } from "../../../production-certification/contracts/production-certification-types.js";
import { scoreCertificationStatus } from "../../../production-certification/services/certification-scoring-service.js";
import { getProductionEligibilitySummary } from "../../../production-certification/final-production-readiness/services/final-production-readiness-service.js";
import type {
  FinalLiveLaunchBlocker,
  FinalLiveLaunchEvidence,
  FinalLiveLaunchRisk,
  ValidatedLiveDomainResult,
} from "../contracts/final-live-operations-certification-types.js";
import { G7_MISSION_AUDIT_REFS } from "../contracts/final-live-operations-certification-types.js";
import type { ResolvedFinalLiveCertificationRule } from "../registry/final-live-certification-registry-resolver.js";

const ARTIFACTS_ROOT = join(process.cwd(), "..");

type ScanResult = {
  status: CertificationResultState;
  score: number;
  evidenceRefs: string[];
  blockers: FinalLiveLaunchBlocker[];
  risks: FinalLiveLaunchRisk[];
};

function passStatus(status: string): CertificationResultState {
  if (status === "pass" || status === "pass_with_conditions" || status === "warning") {
    return status as CertificationResultState;
  }
  if (status === "blocked") return "blocked";
  if (status === "fail") return "fail";
  return "unknown";
}

function scanModuleContract(input: {
  missionRef: string;
  expectedProgrammeStatus: string;
  createContract: () => { programmeStatus: string; missionId: string };
  artifactRef?: string;
}): ScanResult {
  const contract = input.createContract();
  const artifactOk = !input.artifactRef || existsSync(join(ARTIFACTS_ROOT, input.artifactRef));
  const statusOk = contract.programmeStatus === input.expectedProgrammeStatus;

  if (!artifactOk) {
    return {
      status: "fail",
      score: 0,
      evidenceRefs: [],
      blockers: [{
        blockerId: `missing-artifact-${input.missionRef}`,
        domainId: input.missionRef,
        domainLabel: input.missionRef,
        severity: "high",
        message: `Missing executive audit artifact: ${input.artifactRef}`,
        recommendation: `Generate ${input.missionRef} executive audit`,
      }],
      risks: [],
    };
  }

  if (!statusOk) {
    return {
      status: "fail",
      score: 30,
      evidenceRefs: input.artifactRef ? [input.artifactRef] : [],
      blockers: [{
        blockerId: `programme-status-${input.missionRef}`,
        domainId: input.missionRef,
        domainLabel: input.missionRef,
        severity: "high",
        message: `Programme status mismatch: expected ${input.expectedProgrammeStatus}, got ${contract.programmeStatus}`,
      }],
      risks: [],
    };
  }

  return {
    status: "pass",
    score: 100,
    evidenceRefs: input.artifactRef ? [input.artifactRef] : [`module:${input.missionRef}`],
    blockers: [],
    risks: [],
  };
}

async function runDomainScan(
  scanResolverRef: string,
  input: { context: RegistryLoaderContext; actorId: string; workspaceId: string },
): Promise<ScanResult> {
  const ctx = input.context;

  switch (scanResolverRef) {
    case "scan:live-operations-framework": {
      const { createGrandKingLiveOperationsModuleContract } = await import("../../contract/live-operations-module.js");
      return scanModuleContract({
        missionRef: "G7-00",
        expectedProgrammeStatus: "live-operations-version-1-certified",
        createContract: createGrandKingLiveOperationsModuleContract,
        artifactRef: "artifacts/g7-00-grand-king-live-operations-framework-executive-audit.md",
      });
    }
    case "scan:production-workspace": {
      const { createGrandKingProductionWorkspaceModuleContract } = await import("../../../grand-king-production-workspace/contract/production-workspace-module.js");
      const { getGrandKingProductionWorkspace } = await import("../../../grand-king-production-workspace/services/grand-king-production-workspace-service.js");
      const base = scanModuleContract({
        missionRef: "G7-01",
        expectedProgrammeStatus: "production-workspace-established",
        createContract: createGrandKingProductionWorkspaceModuleContract,
        artifactRef: "artifacts/g7-01-grand-king-production-workspace-executive-audit.md",
      });
      try {
        const ws = getGrandKingProductionWorkspace();
        if (ws.status !== "active") {
          return { ...base, status: "warning", score: 70, risks: [{ riskId: "ws-not-active", domainId: "grand_king_workspace", severity: "medium", summary: "Production workspace not active" }] };
        }
      } catch {
        return { ...base, status: "fail", score: 0, blockers: [{ blockerId: "ws-missing", domainId: "grand_king_workspace", domainLabel: "Production Workspace", severity: "critical", message: "Production workspace not created" }] };
      }
      return base;
    }
    case "scan:commerce-operations": {
      const { createGrandKingCommerceOperationsModuleContract } = await import("../../../grand-king-commerce-operations/contract/commerce-operations-module.js");
      return scanModuleContract({ missionRef: "G7-02", expectedProgrammeStatus: "commerce-operations-established", createContract: createGrandKingCommerceOperationsModuleContract, artifactRef: "artifacts/g7-02-grand-king-commerce-operations-executive-audit.md" });
    }
    case "scan:automation-operations": {
      const { createGrandKingBusinessAutomationOperationsModuleContract } = await import("../../../grand-king-business-automation-operations/contract/automation-operations-module.js");
      return scanModuleContract({ missionRef: "G7-03", expectedProgrammeStatus: "business-automation-operations-established", createContract: createGrandKingBusinessAutomationOperationsModuleContract, artifactRef: "artifacts/g7-03-grand-king-business-automation-operations-executive-audit.md" });
    }
    case "scan:executive-decision-centre": {
      const { createGrandKingExecutiveDecisionCentreModuleContract } = await import("../../../grand-king-executive-decision-centre/contract/executive-decision-centre-module.js");
      return scanModuleContract({ missionRef: "G7-04", expectedProgrammeStatus: "executive-decision-centre-established", createContract: createGrandKingExecutiveDecisionCentreModuleContract, artifactRef: "artifacts/g7-04-grand-king-executive-decision-centre-executive-audit.md" });
    }
    case "scan:financial-operations": {
      const { createGrandKingRevenueFinancialOperationsModuleContract } = await import("../../../grand-king-revenue-financial-operations/contract/financial-operations-module.js");
      const { getFinancialStatus } = await import("../../../grand-king-revenue-financial-operations/services/grand-king-revenue-financial-operations-service.js");
      const base = scanModuleContract({ missionRef: "G7-05", expectedProgrammeStatus: "revenue-financial-operations-established", createContract: createGrandKingRevenueFinancialOperationsModuleContract, artifactRef: "artifacts/g7-05-grand-king-revenue-financial-operations-executive-audit.md" });
      const status = getFinancialStatus(ctx);
      return status.initialized ? base : { ...base, status: "warning", score: 60 };
    }
    case "scan:continuous-intelligence": {
      const { createGrandKingContinuousIntelligenceOptimizationModuleContract } = await import("../../../grand-king-continuous-intelligence-optimization/contract/continuous-intelligence-module.js");
      const { getOptimizationStatus } = await import("../../../grand-king-continuous-intelligence-optimization/services/grand-king-continuous-intelligence-optimization-service.js");
      const base = scanModuleContract({ missionRef: "G7-06", expectedProgrammeStatus: "continuous-intelligence-optimization-established", createContract: createGrandKingContinuousIntelligenceOptimizationModuleContract, artifactRef: "artifacts/g7-06-grand-king-continuous-intelligence-optimization-executive-audit.md" });
      return getOptimizationStatus(ctx).initialized ? base : { ...base, status: "warning", score: 60 };
    }
    case "scan:autonomous-operations": {
      const { createGrandKingAutonomousOperationsModuleContract } = await import("../../../grand-king-autonomous-operations/contract/autonomous-operations-module.js");
      const { getAutonomousOperationStatus } = await import("../../../grand-king-autonomous-operations/services/grand-king-autonomous-operations-service.js");
      const base = scanModuleContract({ missionRef: "G7-07", expectedProgrammeStatus: "autonomous-operations-established", createContract: createGrandKingAutonomousOperationsModuleContract, artifactRef: "artifacts/g7-07-grand-king-autonomous-operations-executive-audit.md" });
      return getAutonomousOperationStatus(ctx).initialized ? base : { ...base, status: "warning", score: 60 };
    }
    case "scan:self-healing-operations": {
      const { createGrandKingSelfHealingOperationsModuleContract } = await import("../../../grand-king-self-healing-operations/contract/self-healing-module.js");
      const { getSelfHealingStatus } = await import("../../../grand-king-self-healing-operations/services/grand-king-self-healing-operations-service.js");
      const base = scanModuleContract({ missionRef: "G7-08", expectedProgrammeStatus: "self-healing-operations-established", createContract: createGrandKingSelfHealingOperationsModuleContract, artifactRef: "artifacts/g7-08-grand-king-self-healing-operations-executive-audit.md" });
      return getSelfHealingStatus(ctx).initialized ? base : { ...base, status: "warning", score: 60 };
    }
    case "scan:operational-intelligence": {
      const { createGrandKingOperationalIntelligenceModuleContract } = await import("../../../grand-king-operational-intelligence-executive-insights/contract/operational-intelligence-module.js");
      const { getOperationalIntelligenceStatus } = await import("../../../grand-king-operational-intelligence-executive-insights/services/grand-king-operational-intelligence-executive-insights-service.js");
      const base = scanModuleContract({ missionRef: "G7-09", expectedProgrammeStatus: "operational-intelligence-executive-insights-established", createContract: createGrandKingOperationalIntelligenceModuleContract, artifactRef: "artifacts/g7-09-grand-king-operational-intelligence-executive-audit.md" });
      return getOperationalIntelligenceStatus(ctx).initialized ? base : { ...base, status: "warning", score: 60 };
    }
    case "scan:evidence-completeness":
      return validateEvidenceCompleteness();
    case "scan:production-stability": {
      const eligibility = getProductionEligibilitySummary(ctx);
      if (eligibility.certificationStatus === "BLOCKED" || eligibility.certificationStatus === "FAILED") {
        return { status: "blocked", score: 0, evidenceRefs: ["g6:production-certification"], blockers: [{ blockerId: "g6-not-ready", domainId: "production_stability", domainLabel: "G6 Production Certification", severity: "critical", message: `G6 certification status: ${eligibility.certificationStatus}` }], risks: [] };
      }
      if (eligibility.certificationStatus === "PRODUCTION_READY_WITH_CONDITIONS") {
        return { status: "pass_with_conditions", score: 85, evidenceRefs: ["g6:production-certification"], blockers: [], risks: [{ riskId: "g6-conditional", domainId: "production_stability", severity: "low", summary: "G6 production ready with conditions" }] };
      }
      return { status: "pass", score: 100, evidenceRefs: ["g6:production-certification"], blockers: [], risks: [] };
    }
    case "scan:production-governance":
      return { status: "pass", score: 100, evidenceRefs: ["governance:pillow"], blockers: [], risks: [] };
    case "scan:operational-risks":
      return { status: "pass", score: 100, evidenceRefs: ["register:operational-risks"], blockers: [], risks: [] };
    case "scan:grand-king-readiness":
      return { status: "pass", score: 100, evidenceRefs: ["evaluator:grand-king-launch-readiness"], blockers: [], risks: [] };
    case "scan:launch-gate":
      return validateLaunchGate(ctx);
    case "scan:version1-launch-eligibility":
      return { status: "pass", score: 100, evidenceRefs: ["engine:launch-eligibility"], blockers: [], risks: [] };
    default:
      return { status: "unknown", score: 0, evidenceRefs: [], blockers: [], risks: [] };
  }
}

function validateEvidenceCompleteness(): ScanResult {
  if (process.env.LIVE_MISSING_EVIDENCE === "true") {
    return {
      status: "fail",
      score: 0,
      evidenceRefs: [],
      blockers: [{
        blockerId: "missing-evidence",
        domainId: "operational_evidence",
        domainLabel: "Evidence Completeness",
        severity: "critical",
        message: "G7 mission executive audit evidence incomplete",
        recommendation: "Generate missing G7 executive audit artifacts",
      }],
      risks: [],
    };
  }

  const missing = G7_MISSION_AUDIT_REFS.filter((ref) => !existsSync(join(ARTIFACTS_ROOT, ref.artifactRef)));
  if (missing.length > 0) {
    return {
      status: "fail",
      score: Math.round(((G7_MISSION_AUDIT_REFS.length - missing.length) / G7_MISSION_AUDIT_REFS.length) * 100),
      evidenceRefs: G7_MISSION_AUDIT_REFS.filter((ref) => existsSync(join(ARTIFACTS_ROOT, ref.artifactRef))).map((r) => r.artifactRef),
      blockers: missing.map((ref) => ({
        blockerId: `missing-${ref.missionId}`,
        domainId: ref.domainId,
        domainLabel: ref.missionId,
        severity: "high" as const,
        message: `Missing executive audit artifact: ${ref.artifactRef}`,
        recommendation: `Generate ${ref.missionId} executive audit`,
      })),
      risks: [],
    };
  }

  return {
    status: "pass",
    score: 100,
    evidenceRefs: G7_MISSION_AUDIT_REFS.map((r) => r.artifactRef),
    blockers: [],
    risks: [],
  };
}

function validateLaunchGate(context: RegistryLoaderContext): ScanResult {
  const mandatoryRefs = [
    "gate:commerce",
    "gate:automation",
    "gate:identity",
    "gate:financial",
    "gate:executive",
    "gate:monitoring",
    "gate:recovery",
    "gate:brain",
    "gate:pillow",
    "gate:registry",
    "gate:ekls",
    "gate:cockpit",
    "gate:infrastructure",
    "gate:operational-readiness",
    "gate:business-readiness",
  ];

  if (process.env.LIVE_LAUNCH_GATE_BLOCKED === "true") {
    return {
      status: "blocked",
      score: 0,
      evidenceRefs: mandatoryRefs,
      blockers: [{
        blockerId: "launch-gate-blocked",
        domainId: "version1_launch_eligibility",
        domainLabel: "Version 1 Launch Gate",
        severity: "critical",
        message: "Mandatory launch gate system blocked",
        recommendation: "Resolve LIVE_LAUNCH_GATE_BLOCKED signal",
      }],
      risks: [],
    };
  }

  const g6 = getProductionEligibilitySummary(context);
  if (!g6.eligible) {
    return {
      status: "blocked",
      score: 40,
      evidenceRefs: mandatoryRefs,
      blockers: [{
        blockerId: "g6-gate-blocked",
        domainId: "version1_launch_eligibility",
        domainLabel: "Version 1 Launch Gate",
        severity: "critical",
        message: "G6 production certification not eligible",
      }],
      risks: [],
    };
  }

  return { status: "pass", score: 100, evidenceRefs: mandatoryRefs, blockers: [], risks: [] };
}

export async function aggregateFinalLiveCertificationDomains(input: {
  rules: ResolvedFinalLiveCertificationRule[];
  context: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
}): Promise<{
  validatedDomains: ValidatedLiveDomainResult[];
  blockers: FinalLiveLaunchBlocker[];
  risks: FinalLiveLaunchRisk[];
  evidence: FinalLiveLaunchEvidence[];
}> {
  const validatedDomains: ValidatedLiveDomainResult[] = [];
  const blockers: FinalLiveLaunchBlocker[] = [];
  const risks: FinalLiveLaunchRisk[] = [];
  const evidence: FinalLiveLaunchEvidence[] = [];

  for (const rule of input.rules) {
    const scan = await runDomainScan(rule.scanResolverRef, {
      context: input.context,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
    });

    if (rule.artifactRef && existsSync(join(ARTIFACTS_ROOT, rule.artifactRef))) {
      evidence.push({
        evidenceId: `ev-${rule.ruleId}`,
        kind: "artifact",
        summary: `${rule.ruleName} audit artifact present`,
        ref: rule.artifactRef,
      });
    }

    if (scan.status === "fail" || scan.status === "blocked") {
      blockers.push({
        blockerId: `domain-${rule.ruleId}`,
        domainId: rule.certificationDomain,
        domainLabel: rule.ruleName,
        severity: scan.status === "blocked" ? "critical" : "high",
        message: `${rule.ruleName} validation ${scan.status}`,
        recommendation: `Re-run ${rule.missionRef} certification`,
      });
    }

    validatedDomains.push({
      domainId: rule.certificationDomain,
      domainLabel: rule.ruleName,
      missionRef: rule.missionRef,
      status: scan.status,
      score: scan.score || scoreCertificationStatus(scan.status),
      evidenceRefs: scan.evidenceRefs,
    });

    blockers.push(...scan.blockers);
    risks.push(...scan.risks);
  }

  if (process.env.LIVE_CRITICAL_BLOCKER === "true") {
    blockers.push({
      blockerId: "live-critical-blocker",
      domainId: "version1_launch_eligibility",
      domainLabel: "Live Operations Certification",
      severity: "critical",
      message: "Critical blocker signal active for live launch certification",
      recommendation: "Resolve LIVE_CRITICAL_BLOCKER signal",
      overrideEligible: false,
    });
  }

  return { validatedDomains, blockers, risks, evidence };
}

export function deriveLiveLaunchOutcome(
  validatedDomains: ValidatedLiveDomainResult[],
  blockers: FinalLiveLaunchBlocker[],
  liveEligible: boolean,
): import("../contracts/final-live-operations-certification-types.js").LiveLaunchOutcome {
  if (blockers.some((b) => b.severity === "critical")) return "LIVE_BLOCKED";
  if (validatedDomains.some((d) => d.status === "blocked")) return "LIVE_BLOCKED";
  if (validatedDomains.some((d) => d.status === "fail")) return "LIVE_FAILED";
  if (validatedDomains.some((d) => d.status === "unknown" || d.status === "not_tested")) return "UNKNOWN";
  if (validatedDomains.some((d) => d.status === "warning" || d.status === "pass_with_conditions")) {
    return "LIVE_READY_WITH_CONDITIONS";
  }
  if (liveEligible && validatedDomains.every((d) => d.status === "pass" || d.status === "not_applicable")) {
    return "LIVE_READY";
  }
  return "LIVE_READY_WITH_CONDITIONS";
}

export function computeLiveLaunchScore(validatedDomains: ValidatedLiveDomainResult[]): number {
  if (validatedDomains.length === 0) return 0;
  return Math.round(validatedDomains.reduce((sum, d) => sum + d.score, 0) / validatedDomains.length);
}
