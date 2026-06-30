import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import { buildGrandKingGoLiveChecklist } from "../../grand-king-go-live-checklist/services/grand-king-go-live-checklist-service.js";
import { buildVersion1GovernanceReview } from "../../version-1-governance-review/services/version-1-governance-review-service.js";
import { buildSuccess001ReadinessReview } from "../../success-001-readiness-review/services/success-001-readiness-review-service.js";
import type { Version1GoLiveApproval } from "../models/version-1-go-live-approval.js";

type ReviewItem = Version1GoLiveApproval["items"][number];

/** REAL-099 — EC + Soul + Grand King go-live assessment (recommendation only, no execution). */
export function buildVersion1GoLiveApproval(
  workspaceId: string,
  companyId: string,
): Version1GoLiveApproval {
  const debate = buildExecutiveVisualDebate(workspaceId, companyId, {
    topic: "Version 1 Grand King go-live approval",
    subjectType: "general",
    subjectId: "version-1-platform",
    summary: "SUCCESS-001 USD 100K net profit mission — EC + Soul + Grand King assessment (recommendation only)",
    tags: ["GO_LIVE", "REAL-099"],
  });
  const goLive = buildGrandKingGoLiveChecklist(workspaceId, companyId);
  const governance = buildVersion1GovernanceReview(workspaceId, companyId);
  const successReadiness = buildSuccess001ReadinessReview(workspaceId, companyId);
  const items: ReviewItem[] = [];

  const soulRecommendOnly = debate.soulRecommendation.summary.toLowerCase().includes("recommend");

  items.push({
    itemId: "executive-council-debate",
    label: "Executive Council visual debate (EC)",
    score: 88,
    status: "READY",
    recommendation: debate.soulRecommendation.unifiedRecommendation,
    evidence: `${debate.chiefCards.length} chief cards · confidence=${debate.soulRecommendation.confidence} · recommendOnly=true`,
    why: "EC debate must complete before Soul synthesis — no auto-execute on go-live",
  });

  for (const card of debate.chiefCards.slice(0, 6)) {
    items.push({
      itemId: `chief-${card.executiveId}`,
      label: `${card.title} — ${card.executiveId}`,
      score: card.stance === "PROCEED" ? 85 : card.stance === "PROCEED_WITH_CAUTION" ? 70 : 45,
      status: card.stance === "REJECT" ? "BLOCKED" : card.stance === "DEFER" ? "PENDING" : "READY",
      recommendation: card.recommendation,
      evidence: `stance=${card.stance} · profitImpact=$${card.expectedProfitUsd} · risk=${card.risk}`,
      why: "Each executive must weigh go-live against USD 100K mission risk",
    });
  }

  items.push({
    itemId: "soul-synthesis",
    label: "Soul synthesis — neverExecute gate",
    score: soulRecommendOnly ? 95 : 40,
    status: soulRecommendOnly ? "READY" : "BLOCKED",
    recommendation: debate.soulRecommendation.unifiedRecommendation,
    evidence: `recommendOnly=${soulRecommendOnly} · confidence=${debate.soulRecommendation.confidence}`,
    why: "Soul never bypasses Grand King — synthesis is advisory only at go-live",
  });

  items.push({
    itemId: "governance-chain",
    label: "Governance chain integrity (Observe→Grand King)",
    score: governance.chainIntact ? 92 : Math.round((governance.compliantCount / governance.checks.length) * 100),
    status: governance.chainIntact ? "READY" : governance.nonCompliantCount > 0 ? "BLOCKED" : "PENDING",
    recommendation: governance.chainIntact
      ? "Chain intact — Grand King remains final approval authority"
      : `Resolve ${governance.nonCompliantCount} non-compliant governance checks`,
    evidence: `${governance.compliantCount} compliant · ${governance.bypassCount} bypass detected`,
    why: "REAL-068 governance review validates approval chain before go-live",
  });

  items.push({
    itemId: "grand-king-checklist",
    label: "Grand King go-live checklist (REAL-049)",
    score: goLive.goLiveReady ? 95 : Math.round((goLive.readyCount / goLive.totalCount) * 100),
    status: goLive.goLiveReady ? "READY" : goLive.blockedCount > 0 ? "BLOCKED" : "PENDING",
    recommendation: goLive.goLiveReady
      ? "RECOMMEND: Grand King may approve go-live — all checklist categories ready"
      : `DEFER: ${goLive.blockedCount} blocked checklist items — no execution authorized`,
    evidence: `${goLive.readyCount}/${goLive.totalCount} ready · blocked=${goLive.blockedCount}`,
    why: "Grand King approval is recommendation-only in REAL-099 — Founder executes go-live",
  });

  items.push({
    itemId: "success-001-readiness",
    label: "SUCCESS-001 readiness gate",
    score: Math.round((successReadiness.readyCount / successReadiness.capabilities.length) * 100),
    status: successReadiness.grandKingReady ? "READY" : "BLOCKED",
    recommendation: successReadiness.grandKingReady
      ? "SUCCESS-001 capabilities ready — include in go-live approval package"
      : `${successReadiness.blockerCount} blockers remain — defer go-live execution`,
    evidence: `${successReadiness.readyCount}/${successReadiness.capabilities.length} capabilities · netProfit=$${successReadiness.netProfitUsd}`,
    why: "Go-live without SUCCESS-001 readiness path risks premature scaling",
  });

  const approveRecommended = goLive.goLiveReady
    && governance.chainIntact
    && soulRecommendOnly
    && successReadiness.readyCount >= 4;

  items.push({
    itemId: "final-recommendation",
    label: "Grand King go-live recommendation (no execution)",
    score: approveRecommended ? 90 : 42,
    status: approveRecommended ? "READY" : "BLOCKED",
    recommendation: approveRecommended
      ? "RECOMMEND APPROVAL — EC + Soul + Grand King assessment complete; Founder may execute go-live"
      : "RECOMMEND DEFER — resolve blocked items before authorizing production go-live",
    evidence: `approveRecommended=${approveRecommended} · recommendOnly=true · no execution performed`,
    why: "REAL-099 produces recommendation only — execution requires separate Founder action",
  });

  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);

  return {
    moduleId: "version-1-go-live-approval",
    missionId: "REAL-099",
    workspaceId,
    companyId,
    summary: `REAL-099 — ${approveRecommended ? "RECOMMEND APPROVAL" : "RECOMMEND DEFER"} · EC(${debate.chiefCards.length}) · Soul recommendOnly=${soulRecommendOnly} · goLiveReady=${goLive.goLiveReady}`,
    items,
    reusedModules: [
      "executive-visual-debate",
      "grand-king-go-live-checklist",
      "version-1-governance-review",
      "success-001-readiness-review",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
