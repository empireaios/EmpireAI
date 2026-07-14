export {
  assembleTradeOffAnalysisEngine,
  buildFallbackTradeOffAnalysisEngine,
} from "./assembler.js";
export {
  TRADE_OFF_ANALYSIS_ENGINE_PATH,
  TRADEOFF_PIPELINE,
  TRADEOFF_PRINCIPLES,
  GOVERNED_TRADEOFF_DOMAINS,
  TRADEOFF_CLASSIFICATIONS,
  TRADEOFF_DIMENSIONS,
} from "./paths.js";
export type {
  TradeOffAnalysisEngine,
  TradeOffAnalysis,
  DecisionAlternative,
  TradeOffComparisonEntry,
  TradeOffScoringMetric,
  TradeOffAnalysisRecommendation,
  PillowTradeOffEvaluationMetric,
} from "./types.js";
