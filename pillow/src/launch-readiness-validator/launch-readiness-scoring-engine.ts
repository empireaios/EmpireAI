/** X1-10 — Launch Readiness Scoring Engine (structural signals only). */

import type { DomainScore } from "./business-validation-engine.js";

export class LaunchReadinessScoringEngine {
  score(domains: Record<string, DomainScore>): {
    readinessScore: number;
    readinessBreakdown: string;
    launchBlockers: string;
    launchRecommendation: string;
  } {
    const entries = Object.entries(domains);
    const readinessScore = Math.round(
      entries.reduce((sum, [, d]) => sum + d.score, 0) / Math.max(1, entries.length),
    );
    const readinessBreakdown = entries
      .map(([name, d]) => `${name}:${d.score}(${d.note})`)
      .join(" | ");
    const blockers = entries
      .filter(([, d]) => !d.present || d.score < 50)
      .map(([name, d]) => `${name}:${d.note}`);
    const launchBlockers = blockers.length === 0 ? "none" : blockers.join(" | ");
    const launchRecommendation =
      readinessScore >= 75 && launchBlockers === "none"
        ? "Ready for validated launch certification review"
        : launchBlockers === "none"
          ? "Improve weaker readiness domains before launch"
          : `Resolve blockers: ${launchBlockers}`;

    return { readinessScore, readinessBreakdown, launchBlockers, launchRecommendation };
  }

  certify(readinessScore: number, blockers: string, threshold: number, validated: boolean): boolean {
    if (!validated) return false;
    if (blockers !== "none") return false;
    return readinessScore >= threshold;
  }
}
