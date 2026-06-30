export {
  BUSINESS_OPPORTUNITY_STATUSES,
  businessOpportunityBrandSchema,
  businessOpportunityEconomicsSchema,
  generatedAssetsPreviewSchema,
  marketIntelligenceSchema,
  businessOpportunityRecordSchema,
  approvalHistoryEntrySchema,
  businessOpportunityComparisonSchema,
  businessWorkspaceDashboardSchema,
} from "./models/business-opportunity.js";
export type {
  BusinessOpportunityStatus,
  BusinessOpportunityRecord,
  GeneratedAssetsPreview,
  MarketIntelligence,
  ApprovalHistoryEntry,
  BusinessOpportunityComparison,
  BusinessWorkspaceDashboard,
  BusinessOpportunityListFilters,
} from "./models/business-opportunity.js";

export {
  buildBusinessOpportunityRecord,
  buildBusinessOpportunitiesFromSession,
} from "./services/business-opportunity-builder.js";

export {
  SqliteBusinessOpportunityRepository,
  getBusinessOpportunityRepository,
  resetBusinessOpportunityRepository,
} from "./repositories/sqlite-business-opportunity-repository.js";

export {
  BusinessOpportunityNotFoundError,
  BusinessOpportunityBlockedError,
  syncWorkspaceFromDiscovery,
  listBusinessOpportunities,
  compareBusinessOpportunities,
  approveBusinessOpportunity,
  rejectBusinessOpportunity,
  saveBusinessOpportunityForLater,
  getApprovalHistory,
  buildBusinessWorkspaceDashboard,
} from "./services/business-opportunity-workspace-service.js";

export { registerBusinessOpportunityWorkspaceRoutes } from "./routes/business-opportunity-workspace-routes.js";
export { businessOpportunityWorkspaceTools } from "./tools/business-opportunity-workspace-tools.js";

export {
  BUSINESS_OPPORTUNITY_WORKSPACE_MODULE_ID,
  BUSINESS_OPPORTUNITY_WORKSPACE_CAPABILITIES,
  createBusinessOpportunityWorkspaceModuleContract,
} from "./contract/business-opportunity-workspace-module.js";
export type { BusinessOpportunityWorkspaceCapability } from "./contract/business-opportunity-workspace-module.js";
