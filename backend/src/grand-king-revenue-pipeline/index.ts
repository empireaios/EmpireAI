export {
  createGrandKingRevenuePipelineModuleContract,
  GRAND_KING_REVENUE_PIPELINE_MODULE_ID,
} from "./contract/grand-king-revenue-pipeline-module.js";

export {
  REVENUE_PIPELINE_LIFECYCLE,
  RevenuePipelineStateSchema,
  VALID_STATE_TRANSITIONS,
  canTransition,
} from "./models/revenue-state-machine.js";

export {
  seedRevenuePipeline,
  registerProductCandidate,
  transitionProductState,
  getRevenuePipelineRuntime,
  listPipelineProducts,
  getProductTimeline,
} from "./services/revenue-pipeline-runtime.js";

export { buildProductTimelineSummary } from "./services/revenue-timeline-service.js";
export { computeProductHealth, computeAggregateCommercialHealth } from "./services/revenue-health-service.js";
export {
  enrichProductFromIntegrations,
  getMarketplaceAttachmentPoints,
  getSupplierAttachmentPoints,
  getIntegrationSnapshot,
} from "./services/revenue-integration-service.js";
export { generateRevenuePipelineMissions, listRevenuePipelineMissions } from "./services/revenue-mission-generator.js";
export { buildRevenuePipelineDashboard, buildEsisGkrPayload } from "./services/revenue-pipeline-dashboard-service.js";
export { buildRevenuePipelineHeadquarters } from "./services/revenue-headquarters-service.js";
export { registerGrandKingRevenuePipelineRoutes } from "./routes/grand-king-revenue-pipeline-routes.js";
export { grandKingRevenuePipelineTools } from "./tools/grand-king-revenue-pipeline-tools.js";
export { resetGkrRepository } from "./repositories/sqlite-gkr-repository.js";

export type { PipelineProduct, RevenueHealth, RevenueTimelineEvent, ProductCandidateInput } from "./models/revenue-pipeline-core.js";
export type { RevenuePipelineState } from "./models/revenue-state-machine.js";
export type { RevenuePipelineDashboard, RevenuePipelineHeadquarters, RevenuePipelineMission } from "./models/revenue-dashboard.js";
