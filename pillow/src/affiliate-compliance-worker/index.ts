export {
  AffiliateComplianceWorker,
  createAffiliateComplianceWorker,
  resetAffiliateComplianceWorkerForTesting,
  type AffiliateComplianceWorkerOptions,
} from "./engine.js";
export type { AffiliateComplianceWorkerDependencies } from "./integrations.js";
export {
  buildAffiliateComplianceWorkerConfiguration,
  DEFAULT_AFFILIATE_COMPLIANCE_WORKER_CONFIGURATION,
  type AffiliateComplianceWorkerConfiguration,
} from "./configuration.js";
export {
  AFFILIATE_COMPLIANCE_WORKER_ID,
  AFFILIATE_COMPLIANCE_WORKER_SYSTEM_PATH,
  AFFILIATE_COMPLIANCE_WORKER_IDENTITY,
  ACW_METADATA_VERSION,
  AFFILIATE_COMPLIANCE_REPORT_VERSION,
  ACW_CAPABILITIES,
  INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  AffiliateComplianceWorkerState,
  AffiliateComplianceReport,
  AcwInput,
  AcwRunReport,
  AffiliateComplianceWorkerCatalog,
  AffiliateComplianceWorkerCockpitSnapshot,
  AffiliateComplianceWorkerEngineRecord,
  DisclosureValidation,
  PlatformRuleValidation,
  RecommendedCorrection,
  ReadinessAssessment,
  PolicyFinding,
  ComplianceRisk,
  Q809ConsumableContract,
  IntegrationHandshake as AcwIntegrationHandshake,
} from "./types.js";
