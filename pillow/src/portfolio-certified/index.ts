/** PILLOW-PTC-001 — Portfolio Certified exports (X2-21). */

export {
  PortfolioCertified,
  createPortfolioCertified,
  resetPortfolioCertifiedForTesting,
  type PortfolioCertifiedDependencies,
  type PortfolioCertifiedOptions,
} from "./engine.js";

export {
  buildPortfolioCertifiedConfiguration,
  DEFAULT_PORTFOLIO_CERTIFIED_CONFIGURATION,
  type PortfolioCertifiedConfiguration,
} from "./configuration.js";

export {
  PORTFOLIO_CERTIFIED_SYSTEM_PATH,
  SYSTEM_PATH,
  PTC_METADATA_VERSION,
  PORTFOLIO_CERTIFIED_ID,
  PTC_CAPABILITIES,
  CERTIFIED_MODULE_IDS,
  MODULE_MISSIONS,
} from "./paths.js";

export { appendPtcLog, getPtcLogs, resetPtcLogsForTesting } from "./ptc-logging.js";

export type {
  PortfolioCertifiedState,
  PortfolioCertificationReport,
  CertificationRunReport,
  CertificationEngineRecord,
  CertificationCockpitSnapshot,
  CertificationHealthReport,
  CertificationPerformanceStats,
  ConnectPortfolioCertifiedInput,
  CertifyPortfolioInput,
  CertificationActionInput,
  ModuleCertificationResult,
} from "./types.js";
