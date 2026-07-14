import type { BuilderMonitorAssessment, BuilderMonitorReadinessPipeline } from "./types.js";

export function formatBuilderMonitorPreamble(input: {
  readiness: BuilderMonitorReadinessPipeline;
  lastAssessment: BuilderMonitorAssessment | null;
}): string {
  const lines = [
    "## BUILDER MONITOR (P6-04 — complete execution transparency)",
    "",
    "> Supervisor never assumes · Supervisor continuously verifies · Builder continuously reports.",
    "",
    `**Readiness:** ${input.readiness.readinessScore}/100 · ${input.readiness.recommendedAction}`,
    "",
  ];

  if (input.lastAssessment) {
    lines.push(
      `**Execution Health:** ${input.lastAssessment.executionHealth}`,
      `**Monitor:** ${input.lastAssessment.grandKingSummary}`,
      "",
    );
  }

  lines.push(
    "Builder publishes telemetry · Supervisor interrogates · Journey records timeline.",
    "",
  );

  return lines.join("\n");
}

export function prependBuilderMonitor(document: string, preamble: string): string {
  return `${preamble.trim()}\n\n---\n\n${document}`;
}
