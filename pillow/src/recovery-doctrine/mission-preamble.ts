import type { RecoveryPipelineResult, RecoveryReadinessPipeline } from "./types.js";

export function formatRecoveryPreamble(input: {
  readiness: RecoveryReadinessPipeline;
  lastPipeline?: RecoveryPipelineResult | null;
}): string {
  const { readiness, lastPipeline } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const incident = lastPipeline
    ? [
        "",
        "### Current Incident",
        `- Mission: ${lastPipeline.missionId}`,
        `- Classification: ${lastPipeline.classification}`,
        `- Confidence: ${(lastPipeline.recoveryConfidence * 100).toFixed(0)}%`,
        `- Escalation: ${lastPipeline.escalationLevel}`,
        `- Recovered: ${lastPipeline.recovered ? "YES" : "NO"}`,
      ]
    : ["", "### Current Incident", "- None active — recovery capability ready"];

  return [
    "---",
    "",
    "# RECOVERY DOCTRINE (P4-05 — mandatory constitutional recovery capability)",
    "",
    "> Recovery is NOT an afterthought. EmpireAI recovers automatically when safe.",
    "",
    "## Recovery Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    ...incident,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependRecoveryDoctrine(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
