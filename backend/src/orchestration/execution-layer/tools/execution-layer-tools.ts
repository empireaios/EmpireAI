import type { RegisteredTool } from "../../../brain/types.js";
import {
  analyzeCustomerLifetime,
  buildCommerceOperationsDashboard,
  buildExecutiveCommandCenter,
  buildExecutionLayerDashboard,
  evaluateBusinessHealth,
  generateFullExecutionPipeline,
  generateFulfillmentPackageForBuild,
  generateGrowthOptimizationForOpportunity,
  generateMarketingCampaignForBuild,
  generatePublicationPackageForBuild,
  generateRevenueActivationForBuild,
  getBusinessHealthRecord,
  getCustomerLifetimeRecord,
  getFulfillmentPackage,
  getGrowthOptimizationRecord,
  getMarketingCampaignPackage,
  getPipelineValidation,
  getPublicationPackage,
  getRevenueActivationPackage,
  runPipelineValidation,
  validatePublicationPackage,
} from "../services/execution-layer-service.js";

export const executionLayerTools: RegisteredTool[] = [
  {
    name: "publication_package.generate",
    description: "Generate publication-ready marketplace packages — no live publication",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { buildId: { type: "string" }, actor: { type: "string" } },
      required: ["buildId"],
    },
    handler: async (args) =>
      generatePublicationPackageForBuild(String(args.buildId), args.actor ? String(args.actor) : undefined),
  },
  {
    name: "publication_package.get",
    description: "Get a publication package by ID",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { packageId: { type: "string" } },
      required: ["packageId"],
    },
    handler: async (args) => {
      const pkg = getPublicationPackage(String(args.packageId));
      if (!pkg) throw new Error(`Publication package not found: ${args.packageId}`);
      return pkg;
    },
  },
  {
    name: "publication_package.validate",
    description: "Validate publication package completeness",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { packageId: { type: "string" } },
      required: ["packageId"],
    },
    handler: async (args) => validatePublicationPackage(String(args.packageId)),
  },
  {
    name: "marketing_campaign.generate",
    description: "Generate marketing campaign package — no live ads",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { buildId: { type: "string" }, actor: { type: "string" } },
      required: ["buildId"],
    },
    handler: async (args) =>
      generateMarketingCampaignForBuild(String(args.buildId), args.actor ? String(args.actor) : undefined),
  },
  {
    name: "marketing_campaign.get",
    description: "Get a marketing campaign package by ID",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { packageId: { type: "string" } },
      required: ["packageId"],
    },
    handler: async (args) => {
      const pkg = getMarketingCampaignPackage(String(args.packageId));
      if (!pkg) throw new Error(`Marketing campaign package not found: ${args.packageId}`);
      return pkg;
    },
  },
  {
    name: "fulfillment_package.generate",
    description: "Generate supplier fulfillment package — no execution",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { buildId: { type: "string" }, actor: { type: "string" } },
      required: ["buildId"],
    },
    handler: async (args) =>
      generateFulfillmentPackageForBuild(String(args.buildId), args.actor ? String(args.actor) : undefined),
  },
  {
    name: "fulfillment_package.get",
    description: "Get a fulfillment package by ID",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { packageId: { type: "string" } },
      required: ["packageId"],
    },
    handler: async (args) => {
      const pkg = getFulfillmentPackage(String(args.packageId));
      if (!pkg) throw new Error(`Fulfillment package not found: ${args.packageId}`);
      return pkg;
    },
  },
  {
    name: "revenue_activation.generate",
    description: "Generate revenue activation package — no financial transactions",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { buildId: { type: "string" }, actor: { type: "string" } },
      required: ["buildId"],
    },
    handler: async (args) =>
      generateRevenueActivationForBuild(String(args.buildId), args.actor ? String(args.actor) : undefined),
  },
  {
    name: "revenue_activation.get",
    description: "Get a revenue activation package by ID",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { packageId: { type: "string" } },
      required: ["packageId"],
    },
    handler: async (args) => {
      const pkg = getRevenueActivationPackage(String(args.packageId));
      if (!pkg) throw new Error(`Revenue activation package not found: ${args.packageId}`);
      return pkg;
    },
  },
  {
    name: "commerce_operations.dashboard",
    description: "Build commerce operations dashboard (LIVE-015)",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildCommerceOperationsDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "business_health.evaluate",
    description: "Evaluate unified business health score (LIVE-016)",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { businessOpportunityId: { type: "string" }, actor: { type: "string" } },
      required: ["businessOpportunityId"],
    },
    handler: async (args) =>
      evaluateBusinessHealth(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "business_health.get",
    description: "Get business health record by ID",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { healthId: { type: "string" } },
      required: ["healthId"],
    },
    handler: async (args) => {
      const record = getBusinessHealthRecord(String(args.healthId));
      if (!record) throw new Error(`Business health record not found: ${args.healthId}`);
      return record;
    },
  },
  {
    name: "growth_optimization.recommend",
    description: "Generate growth optimisation recommendations — recommendation only (LIVE-017)",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { businessOpportunityId: { type: "string" }, actor: { type: "string" } },
      required: ["businessOpportunityId"],
    },
    handler: async (args) =>
      generateGrowthOptimizationForOpportunity(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "growth_optimization.get",
    description: "Get growth optimisation record by ID",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { optimizationId: { type: "string" } },
      required: ["optimizationId"],
    },
    handler: async (args) => {
      const record = getGrowthOptimizationRecord(String(args.optimizationId));
      if (!record) throw new Error(`Growth optimization record not found: ${args.optimizationId}`);
      return record;
    },
  },
  {
    name: "customer_lifetime.analyze",
    description: "Generate customer lifetime intelligence — no communications (LIVE-018)",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { businessOpportunityId: { type: "string" }, actor: { type: "string" } },
      required: ["businessOpportunityId"],
    },
    handler: async (args) =>
      analyzeCustomerLifetime(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "customer_lifetime.get",
    description: "Get customer lifetime record by ID",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { recordId: { type: "string" } },
      required: ["recordId"],
    },
    handler: async (args) => {
      const record = getCustomerLifetimeRecord(String(args.recordId));
      if (!record) throw new Error(`Customer lifetime record not found: ${args.recordId}`);
      return record;
    },
  },
  {
    name: "executive_command.dashboard",
    description: "Build Grand King executive command center (LIVE-019)",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildExecutiveCommandCenter(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "pipeline_validation.run",
    description: "Validate end-to-end business pipeline (LIVE-020)",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        businessOpportunityId: { type: "string" },
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["businessOpportunityId", "companyId"],
    },
    handler: async (args) =>
      runPipelineValidation(
        String(args.businessOpportunityId),
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "pipeline_validation.get",
    description: "Get pipeline validation result by ID",
    module: "execution-layer",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { validationId: { type: "string" } },
      required: ["validationId"],
    },
    handler: async (args) => {
      const result = getPipelineValidation(String(args.validationId));
      if (!result) throw new Error(`Pipeline validation not found: ${args.validationId}`);
      return result;
    },
  },
  {
    name: "execution_layer.full_pipeline",
    description: "Generate all execution layer packages (LIVE-011 through LIVE-020) for a build",
    module: "execution-layer",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { buildId: { type: "string" }, actor: { type: "string" } },
      required: ["buildId"],
    },
    handler: async (args) =>
      generateFullExecutionPipeline(String(args.buildId), args.actor ? String(args.actor) : undefined),
  },
];

export { buildExecutionLayerDashboard };
