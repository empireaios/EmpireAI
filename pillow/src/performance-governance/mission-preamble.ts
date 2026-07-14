import type {
  PerformanceGovernanceReadinessPipeline,
  PerformanceGovernanceAssessment,
} from "./types.js";
import { PERFORMANCE_PRINCIPLES } from "./paths.js";

export function formatPerformanceGovernancePreamble(input: {
  readiness: PerformanceGovernanceReadinessPipeline;
  lastAssessment?: PerformanceGovernanceAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const principleLines = PERFORMANCE_PRINCIPLES.map((p) => `- ${p}`);

  const assessmentBlock = lastAssessment
    ? [
        "",
        "## Performance Governance Status",
        `- **Overall Score:** ${lastAssessment.overallPerformanceScore}/100 (${lastAssessment.performanceGrade})`,
        `- **Grand King Summary:** ${lastAssessment.grandKingSummary}`,
        `- **Phase P5:** Complete · ready for P6-01 Execution Control Center`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# PERFORMANCE GOVERNANCE (P5-06 — constitutional runtime responsibility)",
    "",
    "> Performance is measurable · explainable · traceable.",
    "> Performance exists for Grand King experience — not optimization for its own sake.",
    "",
    "## Performance Governance Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Performance Principles",
    ...principleLines,
    assessmentBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependPerformanceGovernance(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
