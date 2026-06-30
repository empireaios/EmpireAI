export {
  FOUNDER_COMMAND_SIGNAL_TYPES,
  founderCommandSignalSchema,
  validateFounderCommandSignal,
} from "./models/founder-command-signal.js";
export type {
  FounderCommandSignalType,
  FounderCommandSignal,
} from "./models/founder-command-signal.js";

export {
  dashboardOpportunitySectionSchema,
  validateDashboardOpportunitySection,
} from "./models/dashboard-opportunity.js";
export type {
  DashboardOpportunityItem,
  DashboardOpportunitySection,
} from "./models/dashboard-opportunity.js";

export {
  dashboardBrandSectionSchema,
  validateDashboardBrandSection,
} from "./models/dashboard-brand.js";
export type { DashboardBrandItem, DashboardBrandSection } from "./models/dashboard-brand.js";

export {
  dashboardStoreSectionSchema,
  validateDashboardStoreSection,
} from "./models/dashboard-store.js";
export type { DashboardStoreItem, DashboardStoreSection } from "./models/dashboard-store.js";

export {
  dashboardSupplierSectionSchema,
  validateDashboardSupplierSection,
} from "./models/dashboard-supplier.js";
export type {
  DashboardSupplierItem,
  DashboardSupplierSection,
} from "./models/dashboard-supplier.js";

export {
  dashboardCampaignSectionSchema,
  validateDashboardCampaignSection,
} from "./models/dashboard-campaign.js";
export type {
  DashboardCampaignItem,
  DashboardCampaignSection,
} from "./models/dashboard-campaign.js";

export {
  dashboardCapitalSectionSchema,
  validateDashboardCapitalSection,
} from "./models/dashboard-capital.js";
export type { DashboardCapitalItem, DashboardCapitalSection } from "./models/dashboard-capital.js";

export {
  dashboardRevenueSectionSchema,
  validateDashboardRevenueSection,
} from "./models/dashboard-revenue.js";
export type { DashboardRevenueSection } from "./models/dashboard-revenue.js";

export {
  dashboardDeploymentSectionSchema,
  validateDashboardDeploymentSection,
} from "./models/dashboard-deployment.js";
export type {
  DashboardDeploymentItem,
  DashboardDeploymentSection,
} from "./models/dashboard-deployment.js";

export {
  founderCommandCenterSchema,
  validateFounderCommandCenter,
} from "./models/founder-command-center.js";
export type {
  FounderCommandCenterId,
  FounderCommandCenter,
  FounderCommandCenterCreateInput,
} from "./models/founder-command-center.js";

export {
  founderCommandCenterRecordSchema,
  validateFounderCommandCenterRecord,
} from "./models/founder-command-center-record.js";
export type {
  FounderCommandCenterRecordId,
  FounderCommandCenterRecord,
  FounderCommandCenterRecordCreateInput,
} from "./models/founder-command-center-record.js";

export type {
  FounderCommandCenterRepositoryQuery,
  FounderCommandCenterRepository,
} from "./repositories/founder-command-center-repository.js";

export {
  InMemoryFounderCommandCenterRepository,
  createInMemoryFounderCommandCenterRepository,
} from "./repositories/in-memory-founder-command-center-repository.js";

export {
  FOUNDER_COMMAND_SIGNAL_WEIGHTS,
  generateFounderCommandCenter,
  founderCommandCenterScoring,
} from "./scoring/founder-command-center-scoring.js";
export type {
  FounderCommandOpportunityInput,
  FounderCommandBrandInput,
  FounderCommandStoreInput,
  FounderCommandSupplierInput,
  FounderCommandCampaignInput,
  FounderCommandCapitalInput,
  FounderCommandRevenueInput,
  FounderCommandDeploymentInput,
  FounderCommandCenterInput,
  FounderCommandCenterBreakdown,
} from "./scoring/founder-command-center-scoring.js";

export {
  FounderCommandCenterEngine,
  defaultFounderCommandCenterEngine,
} from "./engines/founder-command-center-engine.js";

export {
  FOUNDER_COMMAND_CENTER_MODULE_ID,
  FOUNDER_COMMAND_CENTER_MODULE_VERSION,
  FOUNDER_COMMAND_CENTER_CAPABILITIES,
  FOUNDER_COMMAND_CENTER_MODULE_CONTRACT,
  FounderCommandCenterModule,
  createFounderCommandCenterModule,
  founderCommandCenterModule,
} from "./contract/founder-command-center-module.js";
export type {
  FounderCommandCenterModuleId,
  FounderCommandCenterCapability,
  FounderCommandCenterModuleContract,
} from "./contract/founder-command-center-module.js";
