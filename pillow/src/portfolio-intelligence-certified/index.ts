/** PILLOW-PIC-001 — Portfolio Intelligence Certified exports (X2-10). */

export {
  PortfolioIntelligenceCertified,
  createPortfolioIntelligenceCertified,
  resetPortfolioIntelligenceCertifiedForTesting,
  type PortfolioIntelligenceCertifiedDependencies,
  type PortfolioIntelligenceCertifiedOptions,
} from "./engine.js";

export {
  buildPortfolioIntelligenceCertifiedConfiguration,
  DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION,
  type PortfolioIntelligenceCertifiedConfiguration,
} from "./configuration.js";

export {
  PORTFOLIO_INTELLIGENCE_CERTIFIED_SYSTEM_PATH,
  PIC_METADATA_VERSION,
  PORTFOLIO_INTELLIGENCE_CERTIFIED_ID,
  PIC_CAPABILITIES,
  CERTIFIED_MODULE_IDS,
} from "./paths.js";

export { appendPicLog, getPicLogs, resetPicLogsForTesting } from "./pic-logging.js";

export type {
  PortfolioIntelligenceCertifiedState,
  PortfolioIntelligenceCertificationReport,
  CertificationRunReport,
  CertificationEngineRecord,
  CertificationCockpitSnapshot,
  CertificationHealthReport,
  CertificationPerformanceStats,
  ConnectPortfolioIntelligenceCertifiedInput,
  CertifyPortfolioIntelligenceInput,
  CertificationActionInput,
  ModuleCertificationResult,
} from "./types.js";
