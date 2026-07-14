import type { AutonomousRecoveryAssessment, AutonomousRecoveryReadinessPipeline } from "./types.js";

export function formatAutonomousRecoveryPreamble(input: {
  readiness: AutonomousRecoveryReadinessPipeline;
  lastAssessment: AutonomousRecoveryAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const steps = readiness.steps
    .map((s) => `- ${s.status === "passed" ? "✅" : s.status === "degraded" ? "⚠️" : "❌"} **${s.label}** — ${s.summary}`)
    .join("\n");

  return [
    "## AUTONOMOUS RECOVERY ENGINE (P6-06 — safe continuous recovery)",
    "",
    `Readiness: **${readiness.readinessScore}/100** · ${readiness.recommendedAction}`,
    "",
    "### Readiness Pipeline",
    steps,
    "",
    lastAssessment?.grandKingSummary
      ? `### Last Recovery Assessment\n${lastAssessment.grandKingSummary}`
      : "### Last Recovery Assessment\nNo active recovery incident — autonomous recovery standby",
    "",
  ].join("\n");
}

export function prependAutonomousRecoveryEngine(document: string, preamble: string): string {
  return `${preamble}${document}`;
}
