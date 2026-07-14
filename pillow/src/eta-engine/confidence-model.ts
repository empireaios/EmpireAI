import type { EtaConfidenceLevel } from "./types.js";

export function classifyEtaConfidence(input: {
  confidencePercent: number;
  evidenceCount: number;
  hasActiveMission: boolean;
  hasRecovery: boolean;
  hasBlockingDeps: boolean;
}): EtaConfidenceLevel {
  if (!input.hasActiveMission) return "unknown";
  if (input.confidencePercent >= 90 && input.evidenceCount >= 5) return "very_high";
  if (input.confidencePercent >= 75 && input.evidenceCount >= 3) return "high";
  if (input.confidencePercent >= 50) return "medium";
  if (input.hasRecovery || input.hasBlockingDeps) return "low";
  return input.confidencePercent >= 25 ? "low" : "unknown";
}

export function confidencePercentFromEvidence(input: {
  progressKnown: boolean;
  velocityKnown: boolean;
  heartbeatRecent: boolean;
  supervisorSynced: boolean;
  builderSynced: boolean;
  historicalAvailable: boolean;
}): number {
  let score = 30;
  if (input.progressKnown) score += 15;
  if (input.velocityKnown) score += 15;
  if (input.heartbeatRecent) score += 10;
  if (input.supervisorSynced) score += 10;
  if (input.builderSynced) score += 10;
  if (input.historicalAvailable) score += 10;
  return Math.max(0, Math.min(100, score));
}
