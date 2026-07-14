import type {
  ScalingArchitectureReadinessPipeline,
  ScalingArchitectureAssessment,
} from "./types.js";
import { SCALING_PRINCIPLES, SCALING_STAGES } from "./paths.js";

export function formatScalingArchitecturePreamble(input: {
  readiness: ScalingArchitectureReadinessPipeline;
  lastAssessment?: ScalingArchitectureAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const principleLines = SCALING_PRINCIPLES.map((p) => `- ${p}`);
  const stageLines = SCALING_STAGES.map((s) => `- ${s.replace(/_/g, " ")}`);

  const assessmentBlock = lastAssessment
    ? [
        "",
        "## Scaling Architecture Status",
        `- **Current Stage:** ${lastAssessment.currentStage.replace(/_/g, " ")}`,
        `- **Next Stage:** ${lastAssessment.recommendedNextStage.replace(/_/g, " ")}`,
        `- **Grand King Summary:** ${lastAssessment.grandKingSummary}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# SCALING ARCHITECTURE (P5-05 — deliberate production-first evolution)",
    "",
    "> Scaling shall occur deliberately · never prematurely · never reactively.",
    "> V1 is production-first single-instance · constitutional roadmap to HA.",
    "",
    "## Scaling Architecture Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Scaling Stages",
    ...stageLines,
    assessmentBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependScalingArchitecture(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
