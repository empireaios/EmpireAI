import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildGrandKingGoLiveChecklist } from "../../grand-king-go-live-checklist/services/grand-king-go-live-checklist-service.js";
import { buildProductionHardening } from "../../production-hardening/services/production-hardening-service.js";
import { buildVersion1AcceptanceTest } from "../../version-1-acceptance-test/services/version-1-acceptance-test-service.js";
import type { Version1ReleaseCandidate } from "../models/version-1-release-candidate.js";

type ReviewItem = Version1ReleaseCandidate["items"][number];

/** REAL-098 — Release candidate report from acceptance + hardening + go-live checklist. */
export function buildVersion1ReleaseCandidate(
  workspaceId: string,
  companyId: string,
): Version1ReleaseCandidate {
  const acceptance = buildVersion1AcceptanceTest(workspaceId, companyId);
  const hardening = buildProductionHardening(workspaceId, companyId);
  const goLive = buildGrandKingGoLiveChecklist(workspaceId, companyId);
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);
  const items: ReviewItem[] = [];

  for (const check of acceptance.acceptanceReport.items) {
    items.push({
      itemId: `acceptance-${check.checkId}`,
      label: `Acceptance: ${check.label}`,
      score: check.status === "PASS" ? 95 : 30,
      status: check.status === "PASS" ? "READY" : "BLOCKED",
      recommendation: check.status === "PASS"
        ? "Maintain module — included in RC baseline"
        : `Fix missing module before RC tag: ${check.modulePath}`,
      evidence: check.evidence,
      why: "REAL-048 acceptance gates define Version 1 module completeness",
    });
  }

  items.push({
    itemId: "acceptance-overall",
    label: "Acceptance test overall score",
    score: acceptance.acceptanceReport.overallScore,
    status: acceptance.acceptanceReport.passed ? "READY" : "BLOCKED",
    recommendation: acceptance.acceptanceReport.passed
      ? "Acceptance passed — include in RC release notes"
      : `${acceptance.acceptanceReport.failCount} checks failing — resolve before RC`,
    evidence: `${acceptance.acceptanceReport.passCount}/${acceptance.acceptanceReport.items.length} pass · score=${acceptance.acceptanceReport.overallScore}%`,
    why: "RC requires ≥100% acceptance pass for production tag",
  });

  for (const drift of hardening.potentialDriftItems.slice(0, 6)) {
    items.push({
      itemId: `risk-${drift.itemId}`,
      label: `Production risk: ${drift.category}`,
      score: drift.severity === "HIGH" ? 40 : drift.severity === "MEDIUM" ? 60 : 75,
      status: drift.severity === "HIGH" ? "BLOCKED" : "PENDING",
      recommendation: `Mitigate before RC deploy: ${drift.description}`,
      evidence: `${drift.severity} · ${drift.category}`,
      why: "REAL-047 hardening identifies drift that becomes production incidents at scale",
    });
  }

  for (const checklist of goLive.checklists) {
    items.push({
      itemId: `golive-${checklist.category}`,
      label: `Go-live: ${checklist.label}`,
      score: checklist.status === "READY" ? 90 : checklist.status === "PENDING" ? 65 : 35,
      status: checklist.status === "READY" ? "READY" : checklist.status === "BLOCKED" ? "BLOCKED" : "PENDING",
      recommendation: checklist.blockerExplanation ?? "Category ready for RC",
      evidence: `program=${checklist.programId ?? "n/a"} · status=${checklist.status}`,
      why: "REAL-049 go-live checklist validates RC readiness per commercial dimension",
    });
  }

  items.push({
    itemId: "rc-recommendation",
    label: "RC recommendation summary",
    score: goLive.goLiveReady && acceptance.acceptanceReport.passed ? 92 : 48,
    status: goLive.blockedCount === 0 && acceptance.acceptanceReport.passed ? "READY" : "BLOCKED",
    recommendation: goLive.goLiveReady && acceptance.acceptanceReport.passed
      ? "Tag v1.0.0-rc.1 — proceed to REAL-099 go-live approval"
      : `Defer RC — ${goLive.blockedCount} go-live blockers · ${blockingPrograms.length} MCL blockers`,
    evidence: `goLiveReady=${goLive.goLiveReady} · driftItems=${hardening.potentialDriftItems.length} · validationSuites=${hardening.validationSuiteCount}`,
    why: "Release candidate is recommendation-only — no production deploy without REAL-099 approval",
  });

  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);
  const blockedCount = items.filter((i) => i.status === "BLOCKED").length;

  return {
    moduleId: "version-1-release-candidate",
    missionId: "REAL-098",
    workspaceId,
    companyId,
    summary: `REAL-098 RC report — acceptance ${acceptance.acceptanceReport.overallScore}% · ${blockedCount} blocked items · goLiveReady=${goLive.goLiveReady}`,
    items,
    reusedModules: [
      "version-1-acceptance-test",
      "production-hardening",
      "grand-king-go-live-checklist",
      "master-completion-ledger",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
