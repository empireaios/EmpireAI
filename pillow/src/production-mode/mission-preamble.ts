import type { ProductionModeAssessment, ProductionModeReadinessPipeline } from "./types.js";
import { PRODUCTION_STATES } from "./paths.js";

export function formatProductionModePreamble(input: {
  readiness: ProductionModeReadinessPipeline;
  lastAssessment?: ProductionModeAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const stateLines = PRODUCTION_STATES.map((s) => `- ${s.replace(/_/g, " ")}`);

  const assessmentBlock = lastAssessment
    ? [
        "",
        "## Production Mode Status",
        `- **Overall:** ${lastAssessment.overallStatus}`,
        `- **Enabled:** ${lastAssessment.enabledModules.length} modules`,
        `- **Disabled:** ${lastAssessment.disabledModules.length} modules`,
        `- **Grand King Summary:** ${lastAssessment.grandKingSummary}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# PRODUCTION MODE (P5-02 — permanent operational state doctrine)",
    "",
    "> Production behaviour must never surprise the Grand King.",
    "> Every disabled capability · feature flag · runtime limitation is documented.",
    "> Designed · Implemented · Enabled · Production Ready — one state each.",
    "",
    "## Production Mode Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Production States",
    ...stateLines,
    assessmentBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependProductionMode(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
