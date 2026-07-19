/** R4-11 — Review Collection Engine. */

import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type { CollectCustomerReviewInput } from "./types.js";

export type CollectionResult = {
  valid: boolean;
  errors: string[];
  normalizedRating: number;
  normalizedComment: string;
};

export class ReviewCollectionEngine {
  validateCollection(
    input: CollectCustomerReviewInput,
    config: ReviewManagementEngineConfiguration,
  ): CollectionResult {
    const errors: string[] = [];
    let normalizedRating = input.reviewRating;
    const normalizedComment = (input.reviewComment ?? "").trim();

    if (!input.customerId?.trim()) errors.push("Customer ID is required");
    if (!input.productReference?.trim()) errors.push("Product reference is required");
    if (!input.marketplaceReference) errors.push("Marketplace reference is required");

    if (Number.isNaN(normalizedRating)) {
      errors.push("Review rating must be numeric");
    } else {
      normalizedRating = Math.round(normalizedRating);
      if (normalizedRating < 1 || normalizedRating > 5) {
        errors.push("Review rating must be between 1 and 5");
      }
    }

    if (config.collectionRulesEnabled) {
      for (const rule of config.collectionRules) {
        if (!rule.enabled) continue;
        if (normalizedRating < rule.minRating || normalizedRating > rule.maxRating) {
          errors.push(`Rating ${normalizedRating} outside allowed range for ${rule.label}`);
        }
        if (rule.requireComment && !normalizedComment) {
          errors.push("Review comment is required");
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      normalizedRating,
      normalizedComment,
    };
  }
}
