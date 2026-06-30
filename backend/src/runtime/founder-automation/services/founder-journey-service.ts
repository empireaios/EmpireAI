import { randomUUID } from "node:crypto";

import type { FounderJourney, FounderJourneyStage, FounderJourneyStageId } from "../models/founder-journey.js";
import { FOUNDER_JOURNEY_STAGE_DEFINITIONS } from "../models/founder-journey.js";
import { buildOrLoadGlobalCommerceIdentity } from "../../global-commerce/index.js";
import { computeInfrastructureReadiness, listInfrastructureReadiness } from "../../global-commerce-infrastructure/index.js";
import { computeCountryOnboardingBatch } from "../../global-commerce/index.js";

function stageStatus(
  stageId: FounderJourneyStageId,
  progress: number,
  humanCount: number,
  blocked: boolean,
): FounderJourneyStage["status"] {
  if (blocked && stageId !== "registration") return "BLOCKED";
  if (progress >= 100) return "COMPLETE";
  if (humanCount > 0 && progress >= 40) return "AWAITING_FOUNDER";
  if (progress > 0) return "IN_PROGRESS";
  return "NOT_STARTED";
}

/** E-011 — Founder Journey Engine. */
export function buildFounderJourney(workspaceId: string, companyId: string): FounderJourney {
  const identity = buildOrLoadGlobalCommerceIdentity({ workspaceId, companyId });
  const infraList = listInfrastructureReadiness(workspaceId, companyId);
  const avgInfra = infraList.length
    ? Math.round(infraList.reduce((s, r) => s + r.infrastructureScore, 0) / infraList.length)
    : 0;
  const sgOnboarding = computeCountryOnboardingBatch(workspaceId, companyId, "SG");
  const humanTotal = identity.humanActionsRequired.length;

  const stageProgress: Record<FounderJourneyStageId, { progress: number; human: number; auto: number; blocked: boolean; reason?: string }> = {
    registration: { progress: identity.kycStatus === "VERIFIED" ? 100 : identity.kycStatus === "PENDING_REVIEW" ? 70 : 30, human: identity.kycStatus !== "VERIFIED" ? 1 : 0, auto: 0, blocked: false },
    business_creation: { progress: identity.businessIdentity.businessId ? 100 : identity.businessIdentity.legalName ? 60 : 20, human: identity.businessIdentity.businessId ? 0 : 1, auto: 1, blocked: false },
    brand_selection: { progress: identity.brandIdentity.brandId ? 100 : identity.brandIdentity.brandName ? 50 : 10, human: identity.brandIdentity.brandId ? 0 : 1, auto: 0, blocked: false },
    product_approval: { progress: 40, human: 1, auto: 1, blocked: false, reason: "Awaiting product catalog approval" },
    infrastructure_review: { progress: avgInfra, human: infraList.filter((r) => r.criticalBlockers.length > 0).length, auto: infraList.length, blocked: avgInfra < 30 },
    marketplace_readiness: { progress: sgOnboarding.length ? Math.round(sgOnboarding.reduce((s, o) => s + o.readinessScore, 0) / sgOnboarding.length) : 20, human: sgOnboarding.filter((o) => o.humanActions.length > 0).length, auto: sgOnboarding.filter((o) => o.automatableActions.length > 0).length, blocked: false },
    launch_approval: { progress: identity.termsAccepted ? 60 : 20, human: identity.termsAccepted ? 1 : 2, auto: 0, blocked: !identity.termsAccepted },
    growth_review: { progress: 15, human: 0, auto: 2, blocked: false },
    expansion_approval: { progress: avgInfra >= 55 ? 45 : 10, human: humanTotal > 3 ? 2 : 1, auto: 3, blocked: false },
  };

  const stages: FounderJourneyStage[] = FOUNDER_JOURNEY_STAGE_DEFINITIONS.map((def) => {
    const sp = stageProgress[def.stageId];
    return {
      stageId: def.stageId,
      displayName: def.displayName,
      status: stageStatus(def.stageId, sp.progress, sp.human, sp.blocked),
      progressPercent: sp.progress,
      blockingReason: sp.reason,
      humanActionsCount: sp.human,
      automatableActionsCount: sp.auto,
    };
  });

  const currentStage = stages.find((s) => s.status !== "COMPLETE") ?? stages[stages.length - 1]!;
  const overallProgress = Math.round(stages.reduce((s, st) => s + st.progressPercent, 0) / stages.length);

  return {
    journeyId: randomUUID(),
    workspaceId,
    companyId,
    accountType: identity.accountType,
    currentStageId: currentStage.stageId,
    stages,
    overallProgressPercent: overallProgress,
    computedAt: new Date().toISOString(),
  };
}
