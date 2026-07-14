import {
  assembleInvestmentEvaluationEngine,
  buildFallbackInvestmentEvaluationEngine,
} from "@empireai/pillow";

/** Fallback Investment Evaluation Engine when Pillow session is unavailable. */
export function collectInvestmentEvaluationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-04",
    live: false,
    investmentEvaluationEngine: buildFallbackInvestmentEvaluationEngine(),
  };
}

export { assembleInvestmentEvaluationEngine, buildFallbackInvestmentEvaluationEngine };
