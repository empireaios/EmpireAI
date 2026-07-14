import type {
  VisionIntegrityReadinessPipeline,
  VisionIntegrityAssessment,
} from "./types.js";
import { VIE_PRINCIPLES, VIE_VALIDATION_PIPELINE } from "./paths.js";

export function formatVisionIntegrityPreamble(input: {
  readiness: VisionIntegrityReadinessPipeline;
  lastAssessment?: VisionIntegrityAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const principleLines = VIE_PRINCIPLES.map((p) => `- ${p}`);
  const pipelineLines = VIE_VALIDATION_PIPELINE.map(
    (s, i) => `${i + 1}. ${s.replace(/_/g, " ")}`,
  );

  const assessmentBlock = lastAssessment
    ? [
        "",
        "## Vision Integrity Status",
        `- **Classification:** ${lastAssessment.classification.replace(/_/g, " ")}`,
        `- **Approval:** ${lastAssessment.approvalStatus}`,
        `- **Grand King Summary:** ${lastAssessment.grandKingSummary}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# VISION INTEGRITY ENGINE (P6-02 — Should we do this?)",
    "",
    "> Execution asks Can we do this? · VIE asks Should we do this?",
    "> VIE is the constitutional guardian of Empire direction.",
    "",
    "## VIE Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Vision Validation Pipeline",
    ...pipelineLines.map((l) => `- ${l}`),
    "",
    "## VIE Principles",
    ...principleLines,
    assessmentBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependVisionIntegrityEngine(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
