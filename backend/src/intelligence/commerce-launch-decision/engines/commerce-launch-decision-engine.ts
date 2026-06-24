import type { BuyerProductMatch } from "../../buyer-product-matching/models/buyer-product-match.js";
import type { ReachabilityProfile } from "../../buyer-reachability/models/reachability-profile.js";
import type { ProductOpportunity } from "../../product-opportunity/models/product-opportunity.js";
import type { SupplierOpportunityMatch } from "../../supplier-opportunity-matching/models/supplier-opportunity-match.js";
import type { CommerceLaunchDecisionCreateInput } from "../models/commerce-launch-decision.js";
import {
  scoreCommerceLaunchDecision,
  type CommerceLaunchDecisionInput,
  type LaunchDecisionScoreBreakdown,
} from "../scoring/launch-decision-scoring.js";

/** Evaluates whether Grand King's Account should launch a product opportunity. */
export class CommerceLaunchDecisionEngine {
  evaluate(input: CommerceLaunchDecisionInput): LaunchDecisionScoreBreakdown {
    return scoreCommerceLaunchDecision(input);
  }

  toDecisionInput(input: CommerceLaunchDecisionInput): CommerceLaunchDecisionCreateInput {
    const breakdown = this.evaluate(input);
    return {
      productId: input.opportunity.productId,
      supplierId: input.supplierMatch.supplierId,
      buyerPersonaId: input.opportunity.buyerPersonaId,
      opportunityId: input.opportunity.id,
      decision: breakdown.decision,
      launchScore: breakdown.launchScore,
      confidence: breakdown.confidence,
      reasons: breakdown.reasons,
      risks: breakdown.risks,
      recommendedChannels: breakdown.recommendedChannels,
      suggestedTestBudget: breakdown.suggestedTestBudget,
      expectedOutcome: breakdown.expectedOutcome,
      signals: breakdown.signals,
    };
  }

  decide(
    opportunity: ProductOpportunity,
    supplierMatch: SupplierOpportunityMatch,
    buyerMatch: BuyerProductMatch,
    reachability: ReachabilityProfile,
  ): CommerceLaunchDecisionCreateInput {
    return this.toDecisionInput({ opportunity, supplierMatch, buyerMatch, reachability });
  }
}

export const defaultCommerceLaunchDecisionEngine = new CommerceLaunchDecisionEngine();
