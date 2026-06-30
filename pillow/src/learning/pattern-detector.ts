import type {
  ExtractedLearningCandidate,
  PendingExecutiveLearning,
} from "./types.js";

export interface PatternMatch {
  candidate: ExtractedLearningCandidate;
  repetitionCount: number;
  matchedPendingId: string | null;
  confidenceBoost: number;
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

export function detectRepeatedPatterns(
  candidates: ExtractedLearningCandidate[],
  existingPending: PendingExecutiveLearning[],
  existingApprovedTitles: string[],
): PatternMatch[] {
  const approvedSet = new Set(existingApprovedTitles.map(normalizeTitle));

  return candidates.map((candidate) => {
    const normalized = normalizeTitle(candidate.title);
    if (approvedSet.has(normalized)) {
      return {
        candidate,
        repetitionCount: 1,
        matchedPendingId: null,
        confidenceBoost: 0,
      };
    }

    const pendingMatches = existingPending.filter(
      (item) =>
        normalizeTitle(item.title) === normalized ||
        item.reasoningAreas.some((area) => candidate.reasoningAreas.includes(area)),
    );

    const repetitionCount = pendingMatches.length + 1;
    const matchedPendingId = pendingMatches[0]?.learningId ?? null;
    const confidenceBoost = Math.min(0.2, (repetitionCount - 1) * 0.07);

    return {
      candidate,
      repetitionCount,
      matchedPendingId,
      confidenceBoost,
    };
  });
}

export function buildPatternObservation(
  match: PatternMatch,
): string {
  if (match.repetitionCount <= 1) {
    return match.candidate.observation.observation;
  }
  return `${match.candidate.observation.observation} (observed ${match.repetitionCount} times)`;
}
