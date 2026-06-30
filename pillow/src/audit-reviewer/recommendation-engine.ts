import type { CategoryReviewResult, ReviewRecommendation } from "./types.js";

const ENHANCEMENT_MARKERS = [
  { pattern: /future enhancement/i, kind: "future_enhancement" as const },
  { pattern: /BL-C|enhancement register/i, kind: "future_enhancement" as const },
  { pattern: /mandatory correction|must fix|blocks approval/i, kind: "mandatory_correction" as const },
  { pattern: /repository improvement|sync required/i, kind: "repository_improvement" as const },
  { pattern: /architecture improvement|refactor/i, kind: "architecture_improvement" as const },
  { pattern: /commercial|REAL-|PROOF-/i, kind: "commercial_improvement" as const },
  { pattern: /governance|Journey sync|ADR/i, kind: "governance_improvement" as const },
];

export function categorizeRecommendations(
  auditText?: string | null,
  categories?: CategoryReviewResult[],
): ReviewRecommendation[] {
  const recommendations: ReviewRecommendation[] = [];

  if (auditText) {
    for (const { pattern, kind } of ENHANCEMENT_MARKERS) {
      if (pattern.test(auditText)) {
        recommendations.push({
          kind,
          summary: `Detected in Executive Audit: ${pattern.source.replace(/\\/g, "")}`,
          blocksApproval: kind === "mandatory_correction",
        });
      }
    }

    const futureSection = extractSection(auditText, "Future Enhancements");
    if (futureSection) {
      recommendations.push({
        kind: "future_enhancement",
        summary: "Future Enhancements section present — does not block approval",
        blocksApproval: false,
      });
    }

    const outstanding = extractSection(auditText, "Outstanding");
    if (outstanding && /must|mandatory|block/i.test(outstanding)) {
      recommendations.push({
        kind: "mandatory_correction",
        summary: "Outstanding issues contain mandatory language",
        blocksApproval: true,
      });
    }
  }

  if (categories) {
    for (const cat of categories) {
      if (cat.result === "failed") {
        recommendations.push({
          kind: "mandatory_correction",
          summary: `${cat.category} failed: ${cat.findings[0] ?? "see findings"}`,
          blocksApproval: ["repository_ownership", "acceptance_compliance"].includes(
            cat.category,
          ),
        });
      } else if (cat.result === "partially_passed") {
        recommendations.push({
          kind: "architecture_improvement",
          summary: `${cat.category} partially passed — consider improvement`,
          blocksApproval: false,
        });
      }
    }
  }

  return dedupeRecommendations(recommendations);
}

function extractSection(text: string, heading: string): string | null {
  const re = new RegExp(`#{1,3}\\s*\\d*\\.?\\s*${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,3}|$)`, "i");
  const match = text.match(re);
  return match?.[1]?.trim() ?? null;
}

function dedupeRecommendations(
  items: ReviewRecommendation[],
): ReviewRecommendation[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.summary.slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
