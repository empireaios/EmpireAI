export {
  assembleCapitalRiskEngine,
  buildFallbackCapitalRiskEngine,
} from "./assembler.js";
export {
  CAPITAL_RISK_ENGINE_PATH,
  CAPITAL_RISK_PIPELINE,
  CAPITAL_RISK_PRINCIPLES,
  GOVERNED_CAPITAL_RISK_DOMAINS,
} from "./paths.js";
export type {
  CapitalRiskEngine,
  CapitalRisk,
  CapitalExposureEntry,
  RiskDistributionEntry,
  CapitalRiskMitigationEntry,
  CapitalRiskRecommendation,
} from "./types.js";
