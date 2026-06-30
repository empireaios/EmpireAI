import { z } from "zod";

import { accountReadinessSummarySchema } from "../../account-infrastructure-engine/models/account-readiness-summary.js";
import { marketplacePublishingReadinessSchema } from "../../marketplace-connection-engine/models/marketplace-publishing-readiness.js";
import { commerceReadinessDashboardSchema } from "../../commerce-readiness-engine/models/commerce-readiness.js";
import { discoveryDashboardSchema } from "../../product-discovery-opportunity-engine/models/product-opportunity.js";
import { businessWorkspaceDashboardSchema } from "../../business-opportunity-workspace/models/business-opportunity.js";
import { businessPreviewDashboardSchema } from "../../business-preview-studio/models/business-preview.js";
import { marketStrategyDashboardSchema } from "../../market-domination-strategy-engine/models/market-domination-strategy.js";
import { businessBuildDashboardSchema } from "../../business-build-engine/models/business-build-package.js";
import { businessSimulationDashboardSchema } from "../../business-simulation-engine/models/business-simulation.js";
import {
  commerceOperationsDashboardSchema,
  executiveCommandCenterSchema,
} from "../../execution-layer/models/execution-packages.js";
import { realityIntegrationDashboardSchema } from "../../reality-integration/models/reality-integration.js";
import { eyeSeriesDashboardSchema } from "../../eye-series/models/eye-series.js";
import { operationFirstDollarDashboardSchema } from "../../../operation-first-dollar/models/operation-first-dollar.js";

export const dashboardComponentStatuses = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "READY",
  "PARTIAL",
  "BLOCKED",
  "CONNECTED",
  "NOT_CONNECTED",
  "CONNECTING",
  "ERROR",
] as const;

export type DashboardComponentStatus = (typeof dashboardComponentStatuses)[number];

export const grandKingsDashboardSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  accountType: z.enum(["grand_king", "founder"]).default("grand_king"),
  brand: z.object({ status: z.enum(dashboardComponentStatuses), label: z.string() }),
  supplier: z.object({ status: z.enum(dashboardComponentStatuses), label: z.string(), connectorId: z.string() }),
  stripe: z.object({ status: z.enum(dashboardComponentStatuses), label: z.string() }),
  cj: z.object({ status: z.enum(dashboardComponentStatuses), label: z.string() }),
  store: z.object({ status: z.enum(dashboardComponentStatuses), label: z.string(), storeId: z.string().optional() }),
  products: z.object({ status: z.enum(dashboardComponentStatuses), label: z.string(), count: z.number().int().min(0) }),
  launch: z.object({ status: z.enum(dashboardComponentStatuses), label: z.string(), launchStatus: z.string() }),
  marketplaces: z.array(
    z.object({
      marketplaceId: z.string(),
      displayName: z.string(),
      status: z.enum(["NOT_CONNECTED", "CONNECTING", "CONNECTED", "EXPIRED", "ERROR"]),
      health: z.string(),
    }),
  ),
  workflowStage: z.string().optional(),
  launchReadiness: z.enum(["NOT_READY", "READY_TO_LAUNCH", "LAUNCHED"]).optional(),
  accountReadiness: accountReadinessSummarySchema.optional(),
  marketplacePublishingReadiness: marketplacePublishingReadinessSchema.optional(),
  commerceReadiness: commerceReadinessDashboardSchema.optional(),
  productDiscovery: discoveryDashboardSchema.optional(),
  businessOpportunityWorkspace: businessWorkspaceDashboardSchema.optional(),
  businessPreviewStudio: businessPreviewDashboardSchema.optional(),
  marketDominationStrategy: marketStrategyDashboardSchema.optional(),
  businessBuildEngine: businessBuildDashboardSchema.optional(),
  businessSimulationEngine: businessSimulationDashboardSchema.optional(),
  commerceOperations: commerceOperationsDashboardSchema.optional(),
  executiveCommandCenter: executiveCommandCenterSchema.optional(),
  realityIntegration: realityIntegrationDashboardSchema.optional(),
  eyeSeries: eyeSeriesDashboardSchema.optional(),
  operationFirstDollar: operationFirstDollarDashboardSchema.optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type GrandKingsDashboard = z.infer<typeof grandKingsDashboardSchema>;
