import { getBusinessOpportunityRepository } from "../../business-opportunity-workspace/index.js";
import { getBusinessPreviewRepository } from "../../business-preview-studio/index.js";
import { getBusinessBuildRepository } from "../../business-build-engine/index.js";
import { getBusinessSimulationRepository } from "../../business-simulation-engine/index.js";
import { getMarketStrategyRepository } from "../../market-domination-strategy-engine/index.js";
import { getProductDiscoveryRepository } from "../../product-discovery-opportunity-engine/index.js";
import type { BusinessBuildPackage } from "../../business-build-engine/models/business-build-package.js";
import type { BusinessSimulationRecord } from "../../business-simulation-engine/models/business-simulation.js";
import type { BusinessOpportunityRecord } from "../../business-opportunity-workspace/models/business-opportunity.js";
import type { BusinessPreviewRecord } from "../../business-preview-studio/models/business-preview.js";
import type { MarketDominationStrategyDocument } from "../../market-domination-strategy-engine/models/market-domination-strategy.js";

export class ExecutionPipelineBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionPipelineBlockedError";
  }
}

export interface ExecutionPipelineContext {
  build: BusinessBuildPackage;
  simulation: BusinessSimulationRecord;
  opportunity: BusinessOpportunityRecord;
  preview: BusinessPreviewRecord;
  strategy: MarketDominationStrategyDocument;
  discoverySessionId?: string;
}

export function resolveExecutionPipelineByBuild(buildId: string): ExecutionPipelineContext {
  const build = getBusinessBuildRepository().getBuild(buildId);
  if (!build) {
    throw new ExecutionPipelineBlockedError(`Business build not found: ${buildId}`);
  }
  if (build.status !== "READY_FOR_PUBLICATION") {
    throw new ExecutionPipelineBlockedError(
      `Execution layer requires READY_FOR_PUBLICATION build — status: ${build.status}`,
    );
  }

  const simulation = getBusinessSimulationRepository().getLatestByBuild(buildId);
  if (!simulation) {
    throw new ExecutionPipelineBlockedError(
      "Business simulation required before execution layer packages",
    );
  }

  const opportunity = getBusinessOpportunityRepository().getOpportunity(build.businessOpportunityId);
  if (!opportunity) {
    throw new ExecutionPipelineBlockedError("Source business opportunity not found");
  }

  const preview = getBusinessPreviewRepository().getPreview(build.previewId);
  if (!preview) {
    throw new ExecutionPipelineBlockedError("Business preview not found");
  }

  const strategy = getMarketStrategyRepository().getStrategy(build.strategyId);
  if (!strategy) {
    throw new ExecutionPipelineBlockedError("Market domination strategy not found");
  }

  const discoverySessions = getProductDiscoveryRepository().listSessions(
    build.workspaceId,
    build.companyId,
  );
  const discoverySessionId = discoverySessions[0]?.sessionId;

  return { build, simulation, opportunity, preview, strategy, discoverySessionId };
}

export function resolveExecutionPipelineByOpportunity(
  businessOpportunityId: string,
): ExecutionPipelineContext {
  const build = getBusinessBuildRepository().getLatestByOpportunity(businessOpportunityId);
  if (!build) {
    throw new ExecutionPipelineBlockedError(
      `No build package for opportunity: ${businessOpportunityId}`,
    );
  }
  return resolveExecutionPipelineByBuild(build.buildId);
}
