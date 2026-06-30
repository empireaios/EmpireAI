import type { ExtractedLearningCandidate } from "./types.js";

export interface ConfidenceScore {
  score: number;
  label: "low" | "medium" | "high" | "very_high";
  factors: string[];
}

export function scoreLearningConfidence(
  candidate: ExtractedLearningCandidate,
  repetitionCount = 1,
): ConfidenceScore {
  const factors: string[] = [];
  let score = candidate.confidence;

  if (candidate.observation.evidence.length >= 2) {
    score += 0.05;
    factors.push("multiple_evidence_lines");
  }

  if (repetitionCount >= 2) {
    score += Math.min(0.15, (repetitionCount - 1) * 0.05);
    factors.push(`pattern_repeated_${repetitionCount}x`);
  }

  if (candidate.category === "A") {
    factors.push("category_a_principle");
  }

  score = Math.min(0.99, Math.round(score * 100) / 100);

  return {
    score,
    label: confidenceLabel(score),
    factors,
  };
}

function confidenceLabel(score: number): ConfidenceScore["label"] {
  if (score >= 0.9) return "very_high";
  if (score >= 0.75) return "high";
  if (score >= 0.55) return "medium";
  return "low";
}

export function meetsConfirmationThreshold(score: number, category: string): boolean {
  if (category === "D") return false;
  if (category === "A") return score >= 0.7;
  return score >= 0.55;
}
