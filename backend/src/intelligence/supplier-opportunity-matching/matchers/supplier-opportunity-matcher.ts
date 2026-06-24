import type { ProductOpportunity } from "../../product-opportunity/models/product-opportunity.js";
import type { SupplierProfile } from "../../supplier-intelligence/models/supplier-profile.js";
import type { SupplierOpportunityMatchCreateInput } from "../models/supplier-opportunity-match.js";
import {
  scoreSupplierOpportunityMatch,
  type SupplierOpportunityMatchInput,
  type SupplierOpportunityScoreBreakdown,
} from "../scoring/supplier-opportunity-scoring.js";

/** Matches suppliers to product opportunities for fulfillment routing. */
export class SupplierOpportunityMatcher {
  score(input: SupplierOpportunityMatchInput): SupplierOpportunityScoreBreakdown {
    return scoreSupplierOpportunityMatch(input);
  }

  match(input: SupplierOpportunityMatchInput): SupplierOpportunityMatchCreateInput {
    const breakdown = this.score(input);
    return {
      supplierId: input.supplier.supplierId,
      productId: input.opportunity.productId,
      opportunityId: input.opportunity.id,
      matchScore: breakdown.matchScore,
      matchTier: breakdown.matchTier,
      confidence: breakdown.confidence,
      strengths: breakdown.strengths,
      weaknesses: breakdown.weaknesses,
      recommendedUse: breakdown.recommendedUse,
      signals: breakdown.signals,
    };
  }

  rankSuppliersForOpportunity(
    opportunity: ProductOpportunity,
    suppliers: SupplierProfile[],
    productCategories: string[] = [],
  ): Array<SupplierOpportunityMatchCreateInput & { supplierId: string }> {
    return suppliers
      .map((supplier) => this.match({ opportunity, supplier, productCategories }))
      .sort(
        (left, right) => right.matchScore - left.matchScore || right.confidence - left.confidence,
      );
  }

  findBestSupplier(
    opportunity: ProductOpportunity,
    suppliers: SupplierProfile[],
    productCategories: string[] = [],
  ): SupplierOpportunityMatchCreateInput | null {
    const ranked = this.rankSuppliersForOpportunity(opportunity, suppliers, productCategories);
    return ranked[0] ?? null;
  }
}

export const defaultSupplierOpportunityMatcher = new SupplierOpportunityMatcher();
