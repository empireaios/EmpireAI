import type { FounderShellAssessment, FounderShellReadinessPipeline } from "./types.js";

export function formatFounderShellPreamble(input: {
  readiness: FounderShellReadinessPipeline;
  lastAssessment: FounderShellAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const steps = readiness.steps
    .map(
      (s) =>
        `- ${s.status === "passed" ? "✅" : s.status === "degraded" ? "⚠️" : "❌"} **${s.label}** — ${s.summary}`,
    )
    .join("\n");

  return [
    "## FOUNDER SHELL (P7-01 — unified executive workspace)",
    "",
    `Readiness: **${readiness.readinessScore}/100** · ${readiness.recommendedAction}`,
    "",
    "### Readiness Pipeline",
    steps,
    "",
    lastAssessment?.grandKingSummary
      ? `### Founder Shell Status\n${lastAssessment.grandKingSummary}`
      : "### Founder Shell Status\nFounder Shell standby — one login, one workspace, one navigation",
    "",
  ].join("\n");
}

export function prependFounderShell(document: string, preamble: string): string {
  return `${preamble}${document}`;
}
