import { getGovernanceEngine } from "../../../foundation/empire-governance/services/governance-engine.js";
import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import { getBusinessOpportunityRepository } from "../../business-opportunity-workspace/index.js";
import { getBusinessPreviewRepository } from "../../business-preview-studio/index.js";
import { getMarketStrategyRepository } from "../../market-domination-strategy-engine/index.js";
import type {
  BuildValidationResult,
  BusinessBuildDashboard,
  BusinessBuildPackage,
  BusinessBuildSummary,
} from "../models/business-build-package.js";
import {
  getBusinessBuildRepository,
  resetBusinessBuildRepository,
} from "../repositories/sqlite-business-build-repository.js";
import {
  assembleBusinessBuildPackage,
  validateBuildPackage,
} from "./business-build-package-generator.js";

export { getBusinessBuildRepository, resetBusinessBuildRepository };

const BLOCKED_STRATEGY_RECOMMENDATIONS = new Set(["DO_NOT_BUILD"]);

export class BusinessBuildNotFoundError extends Error {
  constructor(buildId: string) {
    super(`Business build not found: ${buildId}`);
    this.name = "BusinessBuildNotFoundError";
  }
}

export class BusinessBuildBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessBuildBlockedError";
  }
}

function captureBuildSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor,
      payload,
    });
  } catch {
    // best-effort
  }
}

function resolveBuildInputs(businessOpportunityId: string) {
  const opportunity = getBusinessOpportunityRepository().getOpportunity(businessOpportunityId);
  if (!opportunity) {
    throw new BusinessBuildBlockedError(`Business opportunity not found: ${businessOpportunityId}`);
  }

  const preview = getBusinessPreviewRepository().getLatestByOpportunity(businessOpportunityId);
  if (!preview || preview.status !== "APPROVED_FOR_BUILD") {
    throw new BusinessBuildBlockedError(
      "Build requires approved business preview (APPROVED_FOR_BUILD)",
    );
  }

  const strategy = getMarketStrategyRepository().getLatestByOpportunity(businessOpportunityId);
  if (!strategy) {
    throw new BusinessBuildBlockedError(
      "Build requires market domination strategy — generate strategy first (LIVE-008)",
    );
  }
  if (BLOCKED_STRATEGY_RECOMMENDATIONS.has(strategy.grandKingRecommendation.recommendation)) {
    throw new BusinessBuildBlockedError(
      `Strategy recommendation ${strategy.grandKingRecommendation.recommendation} blocks build`,
    );
  }

  return { opportunity, preview, strategy };
}

/** Starts business build — construction only, no publishing or fulfillment. */
export function startBusinessBuild(
  businessOpportunityId: string,
  actor?: string,
): BusinessBuildPackage {
  const { opportunity, preview, strategy } = resolveBuildInputs(businessOpportunityId);

  const governance = getGovernanceEngine();
  const verdict = governance.evaluateDecision({
    workspaceId: opportunity.workspaceId,
    domain: "grandKings",
    module: "business-build-engine",
    action: "start_business_build",
    actor: actor ?? "founder",
    correlationId: businessOpportunityId,
    payload: { businessOpportunityId, previewId: preview.previewId, strategyId: strategy.strategyId },
  });

  if (!verdict.allowed) {
    throw new BusinessBuildBlockedError(verdict.reason ?? "Governance blocked business build");
  }

  const built = assembleBusinessBuildPackage({ opportunity, preview, strategy });
  const saved = getBusinessBuildRepository().saveBuild(built);

  captureBuildSoulRuntime(
    opportunity.workspaceId,
    "Business build completed",
    `${opportunity.brand.businessName} — ${saved.status}`,
    actor ?? "business-build-engine",
    { buildId: saved.buildId, status: saved.status },
  );

  return saved;
}

export function getBusinessBuildStatus(buildId: string): BusinessBuildPackage | null {
  return getBusinessBuildRepository().getBuild(buildId);
}

export function getBusinessBuildPackage(buildId: string): BusinessBuildPackage | null {
  return getBusinessBuildRepository().getBuild(buildId);
}

export function validateBusinessBuild(buildId: string): BuildValidationResult {
  const build = getBusinessBuildRepository().getBuild(buildId);
  if (!build) throw new BusinessBuildNotFoundError(buildId);

  const validation = validateBuildPackage(build);
  const updated = getBusinessBuildRepository().saveBuild({
    ...build,
    validation,
    buildProgress: Math.min(
      100,
      Math.round(
        (validation.assetsCompleted / validation.assetsRequired) * 70 +
          (validation.marketplacePackagesReady / 5) * 20 +
          (validation.supplierReady ? 10 : 0),
      ),
    ),
    status: validation.valid ? "READY_FOR_PUBLICATION" : build.status === "FAILED" ? "FAILED" : "BUILDING",
  });

  return updated.validation;
}

export function buildBusinessBuildSummary(
  workspaceId: string,
  companyId: string,
): BusinessBuildSummary {
  const builds = getBusinessBuildRepository().listBuilds(workspaceId, companyId);
  const readyForPublication = builds.filter((entry) => entry.status === "READY_FOR_PUBLICATION").length;
  const inProgress = builds.filter((entry) =>
    ["PENDING_BUILD", "BUILDING"].includes(entry.status),
  ).length;
  const failed = builds.filter((entry) => entry.status === "FAILED").length;
  const averagePublicationReadiness =
    builds.length === 0
      ? 0
      : Math.round(
          builds.reduce((sum, entry) => sum + entry.validation.publicationReadiness, 0) / builds.length,
        );

  return {
    workspaceId,
    companyId,
    totalBuilds: builds.length,
    readyForPublication,
    inProgress,
    failed,
    averagePublicationReadiness,
    latestBuild: builds[0],
    computedAt: new Date().toISOString(),
  };
}

export function buildBusinessBuildDashboard(
  workspaceId: string,
  companyId: string,
): BusinessBuildDashboard {
  const summary = buildBusinessBuildSummary(workspaceId, companyId);
  const latest = summary.latestBuild;

  if (!latest) {
    return {
      businessBuildProgress: 0,
      assetsCompleted: 0,
      marketplacePackagesReady: 0,
      supplierReady: false,
      publicationReadiness: 0,
      computedAt: new Date().toISOString(),
    };
  }

  return {
    businessBuildProgress: latest.buildProgress,
    assetsCompleted: latest.validation.assetsCompleted,
    marketplacePackagesReady: latest.validation.marketplacePackagesReady,
    supplierReady: latest.validation.supplierReady,
    publicationReadiness: latest.validation.publicationReadiness,
    buildStatus: latest.status,
    latestBuildId: latest.buildId,
    computedAt: new Date().toISOString(),
  };
}
