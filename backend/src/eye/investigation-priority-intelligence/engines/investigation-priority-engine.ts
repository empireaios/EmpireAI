import {
  scoreInvestigationPriority,
  type InvestigationPriorityAnalysisInput,
  type InvestigationPriorityScoreBreakdown,
} from "../scoring/priority-scoring.js";

/** Evaluates investigation priority from opportunity, forecast, and trust inputs. */
export class InvestigationPriorityEngine {
  evaluate(input: InvestigationPriorityAnalysisInput): InvestigationPriorityScoreBreakdown {
    return scoreInvestigationPriority(input);
  }

  rank(inputs: InvestigationPriorityAnalysisInput[]): InvestigationPriorityScoreBreakdown[] {
    return inputs
      .map((input) => scoreInvestigationPriority(input))
      .sort(
        (left, right) =>
          right.investigationPriorityScore - left.investigationPriorityScore ||
          left.productId.localeCompare(right.productId),
      );
  }
}

export const defaultInvestigationPriorityEngine = new InvestigationPriorityEngine();
