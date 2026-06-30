import { getKpiLifecycleSnapshot } from "../../../revenue/grand-kings-revenue-engine/services/grand-kings-revenue-engine-service.js";
import {
  getInfrastructureConnectionStatus,
  listMarketplaceConnections,
} from "../../marketplace-infrastructure-engine/index.js";
import { getAccountReadiness } from "../../account-infrastructure-engine/index.js";
import { getMarketplacePublishingReadiness } from "../../marketplace-connection-engine/index.js";
import { buildCommerceReadinessDashboard } from "../../commerce-readiness-engine/index.js";
import { buildDiscoveryDashboard } from "../../product-discovery-opportunity-engine/index.js";
import { buildBusinessWorkspaceDashboard } from "../../business-opportunity-workspace/index.js";
import { buildBusinessPreviewDashboard } from "../../business-preview-studio/index.js";
import { buildMarketStrategyDashboard } from "../../market-domination-strategy-engine/index.js";
import { buildBusinessBuildDashboard } from "../../business-build-engine/index.js";
import { buildBusinessSimulationDashboard } from "../../business-simulation-engine/index.js";
import { buildExecutionLayerDashboard } from "../../execution-layer/index.js";
import { buildRealityIntegrationDashboard } from "../../reality-integration/index.js";
import { buildEyeSeriesDashboard } from "../../eye-series/index.js";
import { buildOperationFirstDollarDashboard } from "../../../operation-first-dollar/index.js";
import type { GrandKingsDashboard } from "../models/grand-kings-dashboard.js";
import type { LaunchWorkflowRecord } from "../models/ecommerce-os-workflow.js";
import {
  getEcommerceOsWorkflowRepository,
} from "../repositories/sqlite-ecommerce-os-workflow-repository.js";

function mapConnectionStatus(
  status: ReturnType<typeof getInfrastructureConnectionStatus>,
): GrandKingsDashboard["stripe"]["status"] {
  switch (status) {
    case "CONNECTED":
      return "CONNECTED";
    case "CONNECTING":
      return "CONNECTING";
    case "ERROR":
    case "EXPIRED":
      return "ERROR";
    default:
      return "NOT_CONNECTED";
  }
}

function mapReadinessStatus(
  workflow: LaunchWorkflowRecord | null,
  ready: boolean,
): GrandKingsDashboard["launch"]["status"] {
  if (!workflow) return "NOT_STARTED";
  if (workflow.launchStatus === "READY_TO_LAUNCH" && ready) return "READY";
  if (workflow.stage === "PREPARING_ASSETS" || workflow.stage === "APPROVED") return "IN_PROGRESS";
  if (workflow.readinessBlockers.length > 0) return "BLOCKED";
  return "PARTIAL";
}

/** Builds unified Grand King's Account dashboard from orchestrator + infrastructure state. */
export function buildGrandKingsDashboard(
  workspaceId: string,
  companyId: string,
): GrandKingsDashboard {
  const repository = getEcommerceOsWorkflowRepository();
  const workflows = repository.listWorkflows(workspaceId, companyId);
  const latest = workflows[0] ?? null;

  const stripeStatus = mapConnectionStatus(getInfrastructureConnectionStatus(workspaceId, "stripe"));
  const cjStatus = mapConnectionStatus(getInfrastructureConnectionStatus(workspaceId, "cj-dropshipping"));
  const marketplaces = listMarketplaceConnections(workspaceId);
  const accountReadiness = getAccountReadiness(workspaceId, "grand_king");
  const marketplacePublishingReadiness = getMarketplacePublishingReadiness(workspaceId, "GRAND_KING");
  const commerceReadiness = buildCommerceReadinessDashboard({
    workspaceId,
    companyId,
    accountType: "grand_king",
  });
  const productDiscovery = buildDiscoveryDashboard(workspaceId, companyId);
  const businessOpportunityWorkspace = buildBusinessWorkspaceDashboard(workspaceId, companyId);
  const businessPreviewStudio = buildBusinessPreviewDashboard(workspaceId, companyId);
  const marketDominationStrategy = buildMarketStrategyDashboard(workspaceId, companyId);
  const businessBuildEngine = buildBusinessBuildDashboard(workspaceId, companyId);
  const businessSimulationEngine = buildBusinessSimulationDashboard(workspaceId, companyId);
  const executionLayer = buildExecutionLayerDashboard(workspaceId, companyId);
  const realityIntegration = buildRealityIntegrationDashboard(workspaceId, companyId);
  const eyeSeries = buildEyeSeriesDashboard(workspaceId, companyId);
  const operationFirstDollar = buildOperationFirstDollarDashboard(workspaceId, companyId);

  const brandReady = Boolean(latest?.assets.brandId);
  const productsReady = (latest?.assets.listingsPrepared ?? 0) > 0;
  const storeReady = Boolean(latest?.assets.storeId);
  const launchReady =
    latest?.launchStatus === "READY_TO_LAUNCH" && (latest.readinessBlockers.length ?? 0) === 0;

  let kpiHealth: number | undefined;
  try {
    const kpi = getKpiLifecycleSnapshot(workspaceId, companyId);
    kpiHealth = kpi.overallHealthScore;
  } catch {
    kpiHealth = undefined;
  }
  void kpiHealth;

  return {
    workspaceId,
    companyId,
    accountType: "grand_king",
    brand: {
      status: brandReady ? "READY" : latest ? "IN_PROGRESS" : "NOT_STARTED",
      label: latest?.assets.brandName ?? latest?.brandChoice ?? "No brand selected",
    },
    supplier: {
      status: latest?.assets.supplierConnectionPrepared ? "READY" : cjStatus === "CONNECTED" ? "CONNECTED" : "PARTIAL",
      label: latest?.assets.supplierId ?? "cj-dropshipping",
      connectorId: "cj-dropshipping",
    },
    stripe: {
      status: stripeStatus,
      label: "Stripe",
    },
    cj: {
      status: cjStatus,
      label: "CJ Dropshipping",
    },
    store: {
      status: storeReady ? "READY" : latest ? "IN_PROGRESS" : "NOT_STARTED",
      label: storeReady ? "Store deployed" : "Store pending",
      storeId: latest?.assets.storeId,
    },
    products: {
      status: productsReady ? "READY" : latest ? "IN_PROGRESS" : "NOT_STARTED",
      label: productsReady ? `${latest!.assets.listingsPrepared} listings prepared` : "No products",
      count: latest?.assets.listingsPrepared ?? 0,
    },
    launch: {
      status: mapReadinessStatus(latest, launchReady),
      label: launchReady ? "READY TO LAUNCH" : "Not ready",
      launchStatus: latest?.launchStatus ?? "NOT_READY",
    },
    marketplaces: marketplaces.map((entry) => ({
      marketplaceId: entry.marketplaceId,
      displayName: entry.displayName,
      status: entry.status,
      health: entry.health,
    })),
    workflowStage: latest?.stage,
    launchReadiness: latest?.launchStatus,
    accountReadiness,
    marketplacePublishingReadiness,
    commerceReadiness,
    productDiscovery,
    businessOpportunityWorkspace,
    businessPreviewStudio,
    marketDominationStrategy,
    businessBuildEngine,
    businessSimulationEngine,
    commerceOperations: executionLayer.commerceOperations,
    executiveCommandCenter: executionLayer.executiveCommandCenter,
    realityIntegration,
    eyeSeries,
    operationFirstDollar,
    computedAt: new Date().toISOString(),
  };
}
