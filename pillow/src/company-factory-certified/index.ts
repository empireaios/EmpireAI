/** PILLOW-CFC-001 — Company Factory Certified exports (X1-15). */

export {
  CompanyFactoryCertified,
  createCompanyFactoryCertified,
  resetCompanyFactoryCertifiedForTesting,
  type CompanyFactoryCertifiedDependencies,
  type CompanyFactoryCertifiedOptions,
} from "./engine.js";

export {
  buildCompanyFactoryCertifiedConfiguration,
  DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION,
  type CompanyFactoryCertifiedConfiguration,
} from "./configuration.js";

export {
  COMPANY_FACTORY_CERTIFIED_SYSTEM_PATH,
  CFC_METADATA_VERSION,
  COMPANY_FACTORY_CERTIFIED_ID,
  CFC_CAPABILITIES,
  CERTIFIED_MODULE_IDS,
} from "./paths.js";

export { appendCfcLog, getCfcLogs, resetCfcLogsForTesting } from "./cfc-logging.js";

export type {
  CompanyFactoryCertifiedState,
  CompanyFactoryCertificationReport,
  CertificationRunReport,
  CertificationEngineRecord,
  CertificationCockpitSnapshot,
  CertificationHealthReport,
  CertificationPerformanceStats,
  ConnectCompanyFactoryCertifiedInput,
  CertifyCompanyFactoryInput,
  CertificationActionInput,
  ModuleCertificationResult,
} from "./types.js";
