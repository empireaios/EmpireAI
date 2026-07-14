import type {
  DurableSessionReadinessPipeline,
  SessionArchitectureAssessment,
} from "./types.js";
import { SESSION_LIFECYCLE_STATES } from "./paths.js";

export function formatDurableSessionPreamble(input: {
  readiness: DurableSessionReadinessPipeline;
  lastAssessment?: SessionArchitectureAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const lifecycleLines = SESSION_LIFECYCLE_STATES.map((s) => `- ${s.replace(/_/g, " ")}`);

  const assessmentBlock = lastAssessment
    ? [
        "",
        "## Session Architecture Status",
        `- **Overall:** ${lastAssessment.overallStatus}`,
        `- **Durable layers:** ${lastAssessment.durableLayers.length}`,
        `- **Grand King Summary:** ${lastAssessment.grandKingSummary}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# DURABLE SESSION ARCHITECTURE (P5-03 — permanent session continuity)",
    "",
    "> Session continuity is a constitutional runtime capability.",
    "> Restart · deployment · browser refresh · transient failure must not unnecessarily destroy operational state.",
    "> Sessions survive refresh · recover gracefully · remain secure and traceable.",
    "",
    "## Session Architecture Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Session Lifecycle",
    ...lifecycleLines,
    assessmentBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependDurableSession(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
