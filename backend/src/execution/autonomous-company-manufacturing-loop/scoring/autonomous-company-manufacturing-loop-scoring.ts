import { randomUUID } from "node:crypto";

import { scoreDeploymentBlueprint } from "../../deployment-blueprint/index.js";
import { createCreativeAssetBlueprintModule } from "../../creative-asset-blueprint/index.js";
import { createMarketingCampaignGenesisModule } from "../../marketing-campaign-genesis/index.js";
import { createStoreDeploymentPipelineModule } from "../../store-deployment-pipeline/index.js";
import { createCapitalAllocationModule } from "../../../revenue/capital-allocation-intelligence/index.js";
import { createOpportunityPortfolioModule } from "../../../revenue/opportunity-portfolio/index.js";
import { scoreRevenueOpportunity } from "../../../revenue/revenue-opportunity-synthesis/index.js";
import {
  buildStubCatalogForPlatform,
  createSupplierProductSyncModule,
} from "../../../suppliers/supplier-product-synchronization/index.js";
import { createSupplierConnectorFrameworkModule } from "../../../suppliers/supplier-connector-framework/index.js";
import type { CompanyManufacturingRunCreateInput } from "../models/company-manufacturing-run.js";
import type { ManufacturingSignal, ManufacturingSignalType } from "../models/manufacturing-signal.js";
import type { ManufacturingStageRecord } from "../models/manufacturing-stage.js";
import type { ManufacturingRunStatus } from "../models/manufacturing-run-status.js";
import type { NextAction } from "../models/next-action.js";
import {
  buildEyeSynthesisInput,
  DEFAULT_M072_IDS,
  resolveManufacturingIds,
  type DeterministicManufacturingIdSet,
} from "./manufacturing-mock-inputs.js";
import { runStoreManufacturingPipeline } from "./store-manufacturing-pipeline.js";

export const MANUFACTURING_SIGNAL_WEIGHTS: Record<ManufacturingSignalType, number> = {
  eye_intelligence: 0.14,
  opportunity_selection: 0.16,
  supplier_readiness: 0.12,
  brand_store_pipeline: 0.22,
  marketing_launch: 0.14,
  deployment_package: 0.16,
  loop_composite: 0.06,
};

const TOTAL_CAPITAL = 25_000;

export type CompanyManufacturingLoopInput = {
  workspaceId: string;
  deterministicIds?: DeterministicManufacturingIdSet;
  supplierPlatform?: "CJ_DROPSHIPPING" | "ALIEXPRESS" | "ZENDROP" | "AUTODS";
  totalCapital?: number;
};

export type CompanyManufacturingLoopBreakdown = CompanyManufacturingRunCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: ManufacturingSignalType,
  score: number,
  detail: string,
): ManufacturingSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: MANUFACTURING_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function buildStageRecord(
  stage: ManufacturingStageRecord["stage"],
  moduleId: string,
  label: string,
  status: ManufacturingRunStatus,
  detail: string,
  progress = 100,
): ManufacturingStageRecord {
  return { stage, moduleId, label, status, progress, detail };
}

function buildNextActions(
  supplierConfigured: boolean,
  deploymentValidated: boolean,
): NextAction[] {
  const actions: NextAction[] = [
    {
      actionId: randomUUID(),
      title: "Launch ad campaigns",
      description: "Activate marketing campaigns on recommended platforms and monitor early performance.",
      priority: "HIGH",
      stage: "MARKETING",
    },
    {
      actionId: randomUUID(),
      title: "Review founder command center",
      description: "Inspect the unified dashboard for opportunities, capital, and deployment readiness.",
      priority: "MEDIUM",
      stage: "DEPLOYMENT",
    },
  ];

  if (!supplierConfigured) {
    actions.unshift({
      actionId: randomUUID(),
      title: "Configure supplier credentials",
      description: "Connect live supplier API credentials to enable catalog sync and order placement.",
      priority: "HIGH",
      stage: "SUPPLIER",
    });
  }

  if (!deploymentValidated) {
    actions.push({
      actionId: randomUUID(),
      title: "Validate deployment package",
      description: "Review the deployment package artifacts before any production push.",
      priority: "HIGH",
      stage: "DEPLOYMENT",
    });
  }

  return actions;
}

/** Runs the full Eye → Opportunity → Supplier → Brand → Store → Marketing → Deployment loop. */
export async function runAutonomousCompanyManufacturingLoop(
  input: CompanyManufacturingLoopInput,
): Promise<CompanyManufacturingLoopBreakdown> {
  const { workspaceId } = input;
  const ids = resolveManufacturingIds(input.deterministicIds ?? DEFAULT_M072_IDS);
  const supplierPlatform = input.supplierPlatform ?? "CJ_DROPSHIPPING";
  const totalCapital = input.totalCapital ?? TOTAL_CAPITAL;
  const stages: ManufacturingStageRecord[] = [];

  const eyeInput = buildEyeSynthesisInput(ids.productId);
  const revenueOpportunityResult = scoreRevenueOpportunity(eyeInput);
  const opportunityId = ids.opportunityId;
  stages.push(
    buildStageRecord(
      "EYE",
      "revenue-opportunity-synthesis",
      "Eye Intelligence",
      "COMPLETE",
      `Synthesized ${revenueOpportunityResult.opportunityType} opportunity at ${revenueOpportunityResult.confidence}% confidence`,
    ),
  );

  const portfolioModule = createOpportunityPortfolioModule();
  const portfolioEntry = await portfolioModule.addPortfolioEntry(workspaceId, {
    opportunityId,
    productId: revenueOpportunityResult.productId,
    opportunityType: revenueOpportunityResult.opportunityType,
    confidence: revenueOpportunityResult.confidence,
    expectedValue: revenueOpportunityResult.expectedValue,
    expectedDifficulty: revenueOpportunityResult.expectedDifficulty,
    reasons: revenueOpportunityResult.reasons,
    risks: revenueOpportunityResult.risks,
  });

  const capitalModule = createCapitalAllocationModule();
  const allocations = await capitalModule.persistCapitalAllocations(workspaceId, {
    totalCapital,
    entries: [
      {
        portfolioEntry: {
          entryId: portfolioEntry.entryId,
          revenueOpportunityId: opportunityId,
          productId: revenueOpportunityResult.productId,
          state: portfolioEntry.state,
          portfolioScore: portfolioEntry.portfolioScore,
          capitalPriority: portfolioEntry.capitalPriority,
          riskLevel: portfolioEntry.riskLevel,
        },
        revenueOpportunity: {
          opportunityId,
          productId: revenueOpportunityResult.productId,
          confidence: revenueOpportunityResult.confidence,
          expectedValue: revenueOpportunityResult.expectedValue,
          expectedDifficulty: revenueOpportunityResult.expectedDifficulty,
        },
      },
    ],
  });
  const allocation = allocations[0]!;
  stages.push(
    buildStageRecord(
      "OPPORTUNITY",
      "opportunity-portfolio",
      "Opportunity Portfolio",
      "COMPLETE",
      `Portfolio entry ${portfolioEntry.state} with $${allocation.allocationAmount} allocated`,
    ),
  );

  const supplierModule = createSupplierConnectorFrameworkModule();
  const supplierConnector = await supplierModule.persistConnector(workspaceId, {
    platform: supplierPlatform,
    credentialsConfigured: true,
  });

  const supplierSyncModule = createSupplierProductSyncModule();
  const supplierSyncRecords = await supplierSyncModule.persistSupplierProductSync(workspaceId, {
    connectorId: supplierConnector.supplierConnector.connectorId,
    platform: supplierPlatform,
    catalogItems: buildStubCatalogForPlatform(supplierPlatform),
  });
  stages.push(
    buildStageRecord(
      "SUPPLIER",
      "supplier-connector-framework",
      "Supplier Integration",
      "COMPLETE",
      `Synced ${supplierSyncRecords.length} products from ${supplierPlatform}`,
    ),
  );

  const storePipeline = await runStoreManufacturingPipeline(workspaceId, {
    ...input.deterministicIds,
    productId: ids.productId,
    opportunityId,
    portfolioEntryId: portfolioEntry.entryId,
    allocationId: allocation.allocationId,
  });

  stages.push(
    buildStageRecord(
      "BRAND",
      "brand-genesis",
      "Brand Genesis",
      "COMPLETE",
      `Brand ${storePipeline.brand.brandName} generated`,
    ),
  );
  stages.push(
    buildStageRecord(
      "STORE",
      "store-blueprint",
      "Store Manufacturing",
      "COMPLETE",
      `Store manufactured with ${storePipeline.storePages.pages.length} pages and ${storePipeline.artifacts.artifacts.length} artifacts`,
    ),
  );

  const campaignModule = createMarketingCampaignGenesisModule();
  const campaign = await campaignModule.persistCampaign(workspaceId, {
    brand: {
      brandId: storePipeline.brand.brandId,
      brandName: storePipeline.brand.brandName,
      slogan: storePipeline.brand.slogan,
      niche: storePipeline.brand.niche,
      targetAudience: storePipeline.brand.targetAudience,
      positioning: storePipeline.brand.positioning,
      confidence: storePipeline.brand.confidence,
    },
    offer: {
      offerTitle: storePipeline.offer.offerTitle,
      headline: storePipeline.offer.headline,
      valueProposition: storePipeline.offer.valueProposition,
      keyBenefits: storePipeline.offer.keyBenefits,
      callToAction: storePipeline.offer.callToAction,
      confidence: storePipeline.offer.confidence,
    },
    storeId: storePipeline.ids.storeId,
  });

  const creativeModule = createCreativeAssetBlueprintModule();
  await creativeModule.persistBlueprint(workspaceId, {
    brand: {
      brandId: storePipeline.brand.brandId,
      brandName: storePipeline.brand.brandName,
      slogan: storePipeline.brand.slogan,
      niche: storePipeline.brand.niche,
      targetAudience: storePipeline.brand.targetAudience,
      positioning: storePipeline.brand.positioning,
      confidence: storePipeline.brand.confidence,
    },
    offer: {
      offerTitle: storePipeline.offer.offerTitle,
      headline: storePipeline.offer.headline,
      valueProposition: storePipeline.offer.valueProposition,
      keyBenefits: storePipeline.offer.keyBenefits,
      callToAction: storePipeline.offer.callToAction,
    },
    campaignId: campaign.campaignId,
    storeId: storePipeline.ids.storeId,
    campaignName: campaign.campaignName,
    adAngles: campaign.adAngles.map((angle) => ({
      title: angle.title,
      hook: angle.hook,
    })),
  });
  stages.push(
    buildStageRecord(
      "MARKETING",
      "marketing-campaign-genesis",
      "Marketing Campaign",
      "COMPLETE",
      `Campaign ${campaign.campaignName} with ${campaign.adAngles.length} ad angles`,
    ),
  );

  const deploymentPlan = scoreDeploymentBlueprint({
    project: {
      projectId: storePipeline.ids.projectId,
      generatedStorefrontId: storePipeline.ids.generatedStorefrontId,
      storeId: storePipeline.ids.storeId,
      brandId: storePipeline.brand.brandId,
      projectStructure: storePipeline.materializedProject.projectStructure,
      buildMetadata: storePipeline.materializedProject.buildMetadata,
      confidence: storePipeline.materializedProject.confidence,
      materializedFileCount: storePipeline.materializedProject.materializedFiles.length,
    },
  });

  const deploymentModule = createStoreDeploymentPipelineModule();
  const deploymentRecord = await deploymentModule.persistDeploymentPackage(workspaceId, {
    deploymentPlan: {
      deploymentPlanId: randomUUID(),
      projectId: deploymentPlan.projectId,
      generatedStorefrontId: deploymentPlan.generatedStorefrontId,
      storeId: deploymentPlan.storeId,
      brandId: deploymentPlan.brandId,
      framework: deploymentPlan.framework,
      hostingTarget: deploymentPlan.hostingTarget,
      environmentVariables: deploymentPlan.environmentVariables,
      domainRequirements: deploymentPlan.domainRequirements,
      deploymentSteps: deploymentPlan.deploymentSteps,
      confidence: deploymentPlan.confidence,
    },
    project: {
      projectId: storePipeline.ids.projectId,
      generatedStorefrontId: storePipeline.ids.generatedStorefrontId,
      storeId: storePipeline.ids.storeId,
      brandId: storePipeline.brand.brandId,
      projectStructure: storePipeline.materializedProject.projectStructure,
      materializedFiles: storePipeline.materializedProject.materializedFiles,
      buildMetadata: storePipeline.materializedProject.buildMetadata,
      confidence: storePipeline.materializedProject.confidence,
    },
  });

  const deploymentValidated =
    deploymentRecord.deploymentStatus === "PACKAGE_VALIDATED";
  const deploymentSucceeded =
    deploymentRecord.deploymentStatus !== "PACKAGE_FAILED";
  stages.push(
    buildStageRecord(
      "DEPLOYMENT",
      "store-deployment-pipeline",
      "Store Deployment",
      deploymentSucceeded ? "COMPLETE" : "FAILED",
      `Deployment package ${deploymentRecord.deploymentStatus} for ${deploymentPlan.hostingTarget}`,
    ),
  );

  const eyeScore = revenueOpportunityResult.confidence;
  const opportunityScore = clampScore(
    (portfolioEntry.portfolioScore + allocation.confidence) / 2,
  );
  const supplierScore = clampScore(
    (supplierConnector.confidence +
      supplierSyncRecords.reduce((sum, record) => sum + record.confidence, 0) /
        Math.max(supplierSyncRecords.length, 1)) /
      2,
  );
  const storeScore = clampScore(
    (storePipeline.brand.confidence +
      storePipeline.storeBlueprint.confidence +
      storePipeline.materializedProject.confidence) /
      3,
  );
  const marketingScore = campaign.confidence;
  const deploymentScore = deploymentRecord.confidence;

  const signals: ManufacturingSignal[] = [
    buildSignal(
      "eye_intelligence",
      eyeScore,
      `Eye synthesis produced ${revenueOpportunityResult.opportunityType} opportunity`,
    ),
    buildSignal(
      "opportunity_selection",
      opportunityScore,
      `Portfolio ${portfolioEntry.state} with capital allocated`,
    ),
    buildSignal(
      "supplier_readiness",
      supplierScore,
      `${supplierPlatform} connector ready with ${supplierSyncRecords.length} synced products`,
    ),
    buildSignal(
      "brand_store_pipeline",
      storeScore,
      `Brand and store pipeline completed with ${storePipeline.artifacts.artifacts.length} artifacts`,
    ),
    buildSignal(
      "marketing_launch",
      marketingScore,
      `Campaign ready with ${campaign.platformRecommendations.length} platform recommendations`,
    ),
    buildSignal(
      "deployment_package",
      deploymentScore,
      `Deployment package ${deploymentRecord.deploymentStatus}`,
    ),
  ];

  const weightedScore = signals.reduce(
    (sum, signal) => sum + signal.score * signal.weight,
    0,
  );
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const confidence = clampScore(totalWeight > 0 ? weightedScore / totalWeight : 0);

  signals.push(
    buildSignal(
      "loop_composite",
      confidence,
      `Autonomous manufacturing loop completed across ${stages.length} stages`,
    ),
  );

  const runStatus: ManufacturingRunStatus = stages.some(
    (stage) => stage.status === "FAILED",
  )
    ? "FAILED"
    : stages.every((stage) => stage.status === "COMPLETE")
      ? "COMPLETE"
      : "PARTIAL";

  const nextActions = buildNextActions(
    supplierConnector.supplierHealth.credentialsConfigured,
    deploymentValidated,
  );

  return {
    productId: ids.productId,
    opportunityId,
    brandId: storePipeline.brand.brandId,
    storeId: storePipeline.ids.storeId,
    campaignId: campaign.campaignId,
    deploymentRecordId: deploymentRecord.recordId,
    stages,
    runStatus,
    nextActions,
    confidence,
    signals,
  };
}

export const autonomousCompanyManufacturingLoopScoring = {
  runAutonomousCompanyManufacturingLoop,
  signalWeights: MANUFACTURING_SIGNAL_WEIGHTS,
};
