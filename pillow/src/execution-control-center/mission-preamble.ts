import type {
  ExecutionControlReadinessPipeline,
  ExecutionControlAssessment,
} from "./types.js";
import { ECC_PRINCIPLES, ECC_EXECUTION_PIPELINE } from "./paths.js";

export function formatExecutionControlPreamble(input: {
  readiness: ExecutionControlReadinessPipeline;
  lastAssessment?: ExecutionControlAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const principleLines = ECC_PRINCIPLES.map((p) => `- ${p}`);
  const pipelineLines = ECC_EXECUTION_PIPELINE.map(
    (s, i) => `${i + 1}. ${s.replace(/_/g, " ")}`,
  );

  const assessmentBlock = lastAssessment
    ? [
        "",
        "## ECC Status",
        `- **Coordination Score:** ${lastAssessment.coordinationScore}/100 (${lastAssessment.executionGrade})`,
        `- **Grand King Summary:** ${lastAssessment.grandKingSummary}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# EXECUTION CONTROL CENTER (P6-01 — constitutional execution coordination)",
    "",
    "> ECC is NOT another AI · NOT another Builder.",
    "> Pillow governs · ECC coordinates · Builder executes · Supervisor supervises.",
    "",
    "## ECC Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Execution Pipeline",
    ...pipelineLines.map((l) => `- ${l}`),
    "",
    "## ECC Principles",
    ...principleLines,
    assessmentBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependExecutionControlCenter(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
