import type { RuntimeAssessmentResult, RuntimeReadinessPipeline } from "./types.js";
import { RUNTIME_GOVERNANCE_DOMAINS, RUNTIME_PRINCIPLES } from "./paths.js";

export function formatBrainRuntimePreamble(input: {
  readiness: RuntimeReadinessPipeline;
  lastAssessment?: RuntimeAssessmentResult | null;
}): string {
  const { readiness, lastAssessment } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const domainLines = RUNTIME_GOVERNANCE_DOMAINS.slice(0, 8).map((d) => `- ${d.replace(/_/g, " ")}`);
  const principleLines = RUNTIME_PRINCIPLES.map((p) => `- ${p.replace(/_/g, " ")}`);

  const assessmentBlock = lastAssessment
    ? [
        "",
        "## Latest Runtime Assessment",
        `- **Overall:** ${lastAssessment.overallStatus}`,
        `- **Responsive:** ${lastAssessment.responsive ? "YES" : "NO"}`,
        `- **Active Bottlenecks:** ${lastAssessment.activeBottlenecks.length}`,
        `- **Summary:** ${lastAssessment.summary}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# BRAIN RUNTIME (P5-01 — permanent runtime stability architecture)",
    "",
    "> Phase P5 begins. Brain shall remain responsive regardless of workload.",
    "> No synchronous blocking · No event-loop starvation · No silent degradation.",
    "",
    "## Runtime Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Runtime Principles",
    ...principleLines,
    "",
    "## Governed Domains",
    ...domainLines,
    "…",
    assessmentBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependBrainRuntime(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
