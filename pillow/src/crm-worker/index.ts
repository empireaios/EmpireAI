export {
  CrmWorker,
  createCrmWorker,
  resetCrmWorkerForTesting,
  type CrmWorkerOptions,
} from "./engine.js";
export type { CrmWorkerDependencies } from "./integrations.js";
export {
  buildCrmWorkerConfiguration,
  DEFAULT_CRM_WORKER_CONFIGURATION,
  type CrmWorkerConfiguration,
} from "./configuration.js";
export {
  CRM_WORKER_ID,
  CRM_WORKER_SYSTEM_PATH,
  CRM_WORKER_IDENTITY,
  CRMW_METADATA_VERSION,
  CRM_REPORT_VERSION,
  LEAD_STATUSES,
  LIFECYCLE_STAGES,
  CUSTOMER_STATUSES,
  CRMW_CAPABILITIES,
  INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  CrmWorkerState,
  CrmReport,
  CrmInput,
  CrmWorkerRunReport,
  CrmWorkerCatalog,
  CrmWorkerCockpitSnapshot,
  CrmWorkerEngineRecord,
  CrmWorkerValidationReport,
  CustomerProfile,
  LeadRecord,
  ContactHistoryEntry,
  BookingHistoryLink,
  FollowUp,
  CustomerNote,
  Opportunity,
  CrmAnalytics,
  BookingFixture,
  LeadStatus,
  LifecycleStage,
  CustomerStatus,
  Q706ConsumableContract,
  IntegrationHandshake as CrmwIntegrationHandshake,
} from "./types.js";
