import type {
  ZeroHumanAutomationAssessment,
  ZeroHumanAutomationReadinessPipeline,
} from "./types.js";

export function formatZeroHumanAutomationPreamble(input: {
  readiness: ZeroHumanAutomationReadinessPipeline;
  lastAssessment: ZeroHumanAutomationAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const steps = readiness.steps
    .map((s) => `- ${s.status === "passed" ? "✅" : s.status === "degraded" ? "⚠️" : "❌"} **${s.label}** — ${s.summary}`)
    .join("\n");

  return [
    "## ZERO-HUMAN AUTOMATION (P6-07 — constitutional self-operating architecture)",
    "",
    `Readiness: **${readiness.readinessScore}/100** · ${readiness.recommendedAction}`,
    "",
    "### Readiness Pipeline",
    steps,
    "",
    lastAssessment?.grandKingSummary
      ? `### Automation Status\n${lastAssessment.grandKingSummary}`
      : "### Automation Status\nAutomation standby — Grand King defines direction, EmpireAI executes",
    "",
  ].join("\n");
}

export function prependZeroHumanAutomation(document: string, preamble: string): string {
  return `${preamble}${document}`;
}
