import type { E2eReadinessPipeline, E2eTestExecutionResult } from "./types.js";
import { MANDATORY_E2E_JOURNEYS, TESTING_PYRAMID } from "./paths.js";

export function formatE2eTestingPreamble(input: {
  readiness: E2eReadinessPipeline;
  lastExecution?: E2eTestExecutionResult | null;
}): string {
  const { readiness, lastExecution } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const journeyLines = MANDATORY_E2E_JOURNEYS.map((id) => `- ${id.replace(/_/g, " ")}`);
  const pyramidLines = TESTING_PYRAMID.map((layer) => `- ${layer.replace(/_/g, " ")}`);

  const executionBlock = lastExecution
    ? [
        "",
        "## Latest E2E Execution",
        `- **Pass Rate:** ${Math.round(lastExecution.passRate * 100)}%`,
        `- **Critical Failures:** ${lastExecution.criticalFailures.length}`,
        `- **Acceptance:** ${lastExecution.acceptanceSummary}`,
        `- **Browser Truth:** ${lastExecution.browserTruthAuthority}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# END-TO-END TESTING (P4-07 — mandatory acceptance architecture)",
    "",
    "> Testing provides continuous confidence. Browser Truth (P4-06) remains the final production acceptance authority.",
    "> Testing shall never replace Browser Truth.",
    "",
    "## E2E Testing Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Testing Pyramid",
    ...pyramidLines,
    "",
    "## Mandatory E2E Journeys",
    ...journeyLines,
    executionBlock,
    "",
    "## Deployment Test Pipeline",
    "Critical Tests → Integration Tests → Browser Tests → Production Smoke Tests → Acceptance Summary",
    "",
    "---",
    "",
  ].join("\n");
}

export function prependE2eTesting(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
