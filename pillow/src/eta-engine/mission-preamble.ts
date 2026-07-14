import type { EtaEngineAssessment, EtaReadinessPipeline } from "./types.js";

export function formatEtaEnginePreamble(input: {
  readiness: EtaReadinessPipeline;
  lastAssessment: EtaEngineAssessment | null;
}): string {
  const lines = [
    "## ETA ENGINE (P6-05 — continuously updated remaining time)",
    "",
    "> ETA shall never be static · continuously improved from live execution evidence.",
    "",
    `**Readiness:** ${input.readiness.readinessScore}/100 · ${input.readiness.recommendedAction}`,
    "",
  ];

  if (input.lastAssessment?.lastEstimate) {
    const e = input.lastAssessment.lastEstimate;
    lines.push(
      `**Remaining:** ~${Math.round(e.estimatedRemainingTimeMs / 60000)} min · **Confidence:** ${e.confidencePercent}% (${e.confidenceLevel.replace(/_/g, " ")})`,
      `**ETA:** ${input.lastAssessment.grandKingSummary}`,
      "",
    );
  }

  lines.push("Grand King always knows how much work remains.", "");
  return lines.join("\n");
}

export function prependEtaEngine(document: string, preamble: string): string {
  return `${preamble.trim()}\n\n---\n\n${document}`;
}
