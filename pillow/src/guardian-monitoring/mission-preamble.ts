import type {
  GuardianMonitoringReadinessPipeline,
  GuardianMonitoringAssessment,
} from "./types.js";
import { MONITORING_PRINCIPLES } from "./paths.js";

export function formatGuardianMonitoringPreamble(input: {
  readiness: GuardianMonitoringReadinessPipeline;
  lastAssessment?: GuardianMonitoringAssessment | null;
}): string {
  const { readiness, lastAssessment } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const principleLines = MONITORING_PRINCIPLES.map((p) => `- ${p}`);

  const assessmentBlock = lastAssessment
    ? [
        "",
        "## Guardian Monitoring Status",
        `- **Overall Health:** ${lastAssessment.overallHealth}`,
        `- **Runtime Health:** ${lastAssessment.runtimeHealth}`,
        `- **Open Alerts:** ${lastAssessment.alerts.filter((a) => a.currentStatus === "open" && a.severity !== "informational").length}`,
        `- **Grand King Summary:** ${lastAssessment.grandKingSummary}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# GUARDIAN MONITORING (P5-04 — permanent constitutional monitoring)",
    "",
    "> Guardian monitors · Supervisor supervises · Pillow governs · Brain executes.",
    "> Guardian never owns execution · never replaces Supervisor.",
    "> No production degradation shall remain invisible.",
    "",
    "## Guardian Monitoring Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Monitoring Principles",
    ...principleLines,
    assessmentBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependGuardianMonitoring(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
