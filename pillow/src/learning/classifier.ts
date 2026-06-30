import { CATEGORY_LABELS } from "./patterns.js";
import type { ExecutiveLearningCategory, ExtractedLearningCandidate } from "./types.js";

export interface ClassificationResult {
  category: ExecutiveLearningCategory;
  categoryLabel: string;
  initialStatus: "pending_confirmation" | "pending_approval" | "expired";
  requiresGrandKingApproval: boolean;
  promotionPath: string;
}

export function classifyLearningCandidate(
  candidate: ExtractedLearningCandidate,
): ClassificationResult {
  switch (candidate.category) {
    case "A":
      return {
        category: "A",
        categoryLabel: CATEGORY_LABELS.A,
        initialStatus: "pending_confirmation",
        requiresGrandKingApproval: true,
        promotionPath: "Grand King Approval → Executive Knowledge Base",
      };
    case "B":
      return {
        category: "B",
        categoryLabel: CATEGORY_LABELS.B,
        initialStatus: "pending_confirmation",
        requiresGrandKingApproval: true,
        promotionPath: "Confirmation → Grand King Approval → Executive Knowledge Base",
      };
    case "C":
      return {
        category: "C",
        categoryLabel: CATEGORY_LABELS.C,
        initialStatus: "pending_confirmation",
        requiresGrandKingApproval: false,
        promotionPath: "Confirmation → Project Working Knowledge (may change over time)",
      };
    case "D":
    default:
      return {
        category: "D",
        categoryLabel: CATEGORY_LABELS.D,
        initialStatus: "expired",
        requiresGrandKingApproval: false,
        promotionPath: "Session context only — auto-expires",
      };
  }
}

export function partitionByCategory(candidates: ExtractedLearningCandidate[]): {
  durable: ExtractedLearningCandidate[];
  sessionOnly: ExtractedLearningCandidate[];
} {
  const durable = candidates.filter((item) => item.category !== "D");
  const sessionOnly = candidates.filter((item) => item.category === "D");
  return { durable, sessionOnly };
}
