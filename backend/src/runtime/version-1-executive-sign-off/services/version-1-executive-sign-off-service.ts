import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildGrandKingGoLiveChecklist } from "../../grand-king-go-live-checklist/services/grand-king-go-live-checklist-service.js";
import { buildSuccess001ReadinessReview } from "../../success-001-readiness-review/services/success-001-readiness-review-service.js";
import { buildVersion1AcceptanceTest } from "../../version-1-acceptance-test/services/version-1-acceptance-test-service.js";
import { buildVersion1GoldMaster } from "../../version-1-gold-master/services/version-1-gold-master-service.js";
import { buildVersion1GovernanceReview } from "../../version-1-governance-review/services/version-1-governance-review-service.js";
import type { Version1ExecutiveSignOff } from "../models/version-1-executive-sign-off.js";
import { SIGN_OFF_DOMAINS } from "../models/version-1-executive-sign-off.js";

const DOMAIN_LABELS: Record<Version1ExecutiveSignOff["signOffItems"][number]["domain"], string> = {
  architecture: "Architecture completeness",
  governance: "Governance chain integrity",
  commercial: "Commercial readiness",
  operational: "Operational access readiness",
  financial: "Financial / economics readiness",
  production: "Production hardening",
  deployment: "Deployment readiness",
  grand_king: "Grand King go-live readiness",
  success_readiness: "SUCCESS-001 readiness",
};

/** REAL-070 — Version 1 executive sign-off report. */
export function buildVersion1ExecutiveSignOff(
  workspaceId: string,
  companyId: string,
): Version1ExecutiveSignOff {
  const acceptance = buildVersion1AcceptanceTest(workspaceId, companyId);
  const goldMaster = buildVersion1GoldMaster(workspaceId, companyId);
  const governance = buildVersion1GovernanceReview(workspaceId, companyId);
  const successReadiness = buildSuccess001ReadinessReview(workspaceId, companyId);
  const goLive = buildGrandKingGoLiveChecklist(workspaceId, companyId);

  const acceptanceScore = acceptance.acceptanceReport.overallScore;
  const goldMasterScore = goldMaster.acceptanceScore;
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);
  const blockerLabels = blockingPrograms.map((p) => `${p.name} — ${p.nextCursorMission}`);

  const domainInputs: Record<typeof SIGN_OFF_DOMAINS[number], { score: number; blockers: string[]; evidence: string }> = {
    architecture: {
      score: acceptanceScore,
      blockers: acceptance.acceptanceReport.items.filter((i) => i.status === "FAIL").map((i) => i.label),
      evidence: `${acceptance.acceptanceReport.passCount}/${acceptance.acceptanceReport.items.length} acceptance checks pass`,
    },
    governance: {
      score: governance.chainIntact ? 95 : Math.round((governance.compliantCount / governance.checks.length) * 100),
      blockers: governance.bypassCount > 0 ? ["Governance bypass detected"] : [],
      evidence: `Chain intact: ${governance.chainIntact} · ${governance.compliantCount} compliant`,
    },
    commercial: {
      score: successReadiness.progressPercent,
      blockers: successReadiness.blockers.filter((b) => b.toLowerCase().includes("profit") || b.toLowerCase().includes("commercial")),
      evidence: `Net profit USD ${successReadiness.netProfitUsd} · ${successReadiness.progressPercent}% to SUCCESS-001`,
    },
    operational: {
      score: goLive.readyCount > 0 ? Math.round((goLive.readyCount / goLive.totalCount) * 100) : 50,
      blockers: goLive.checklists.filter((c) => c.status === "BLOCKED").map((c) => c.label),
      evidence: `${goLive.readyCount}/${goLive.totalCount} go-live checklist items ready`,
    },
    financial: {
      score: successReadiness.netProfitUsd > 0 ? 70 : 35,
      blockers: successReadiness.netProfitUsd === 0 ? ["USD 0 verified net profit — ECON-LIVE-001"] : [],
      evidence: "empire-economics + SUCCESS-001 readiness",
    },
    production: {
      score: goldMasterScore >= 80 ? 88 : 65,
      blockers: goldMasterScore < 80 ? ["Acceptance score below gold master threshold"] : [],
      evidence: `Gold master acceptance ${goldMasterScore}%`,
    },
    deployment: {
      score: goLive.checklists.find((c) => c.category === "deployment")?.status === "READY" ? 85 : 55,
      blockers: goLive.checklists.filter((c) => c.category === "deployment" && c.status !== "READY").map((c) => c.label),
      evidence: "Grand King go-live deployment checklist",
    },
    grand_king: {
      score: goLive.goLiveReady ? 95 : Math.round((goLive.readyCount / goLive.totalCount) * 100),
      blockers: goLive.blockedCount > 0 ? [`${goLive.blockedCount} go-live items blocked`] : [],
      evidence: `Go-live ready: ${goLive.goLiveReady}`,
    },
    success_readiness: {
      score: Math.round((successReadiness.readyCount / successReadiness.capabilities.length) * 100),
      blockers: successReadiness.blockers.slice(0, 5),
      evidence: `${successReadiness.readyCount}/${successReadiness.capabilities.length} capabilities ready`,
    },
  };

  const signOffItems: Version1ExecutiveSignOff["signOffItems"] = SIGN_OFF_DOMAINS.map((domain) => {
    const input = domainInputs[domain];
    const status = input.blockers.length > 0
      ? "BLOCKED" as const
      : input.score >= 80
        ? "READY" as const
        : "PENDING" as const;
    return {
      domain,
      label: DOMAIN_LABELS[domain],
      score: input.score,
      status,
      blockers: input.blockers,
      evidence: input.evidence,
    };
  });

  const readyCount = signOffItems.filter((i) => i.status === "READY").length;
  const blockedCount = signOffItems.filter((i) => i.status === "BLOCKED").length;
  const overallScore = Math.round(signOffItems.reduce((s, i) => s + i.score, 0) / signOffItems.length);
  const signOffReady = blockedCount === 0
    && acceptance.acceptanceReport.passed
    && governance.chainIntact
    && overallScore >= 75
    && blockerLabels.length === 0;

  return {
    moduleId: "version-1-executive-sign-off",
    missionId: "REAL-070",
    workspaceId,
    companyId,
    signOffItems,
    readyCount,
    blockedCount,
    overallScore,
    signOffReady,
    acceptanceScore,
    goldMasterScore,
    reusedModules: [
      "version-1-acceptance-test",
      "version-1-gold-master",
      "version-1-governance-review",
      "success-001-readiness-review",
      "grand-king-go-live-checklist",
      "master-completion-ledger",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
