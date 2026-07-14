import type { BrowserReadinessPipeline, BrowserVerificationResult } from "./types.js";
import { formatAcceptanceBlock } from "./acceptance.js";

export function formatBrowserTruthPreamble(input: {
  readiness: BrowserReadinessPipeline;
  lastVerification?: BrowserVerificationResult | null;
}): string {
  const { readiness, lastVerification } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const acceptanceBlock = lastVerification
    ? formatAcceptanceBlock(lastVerification.acceptance)
    : "";

  return [
    "---",
    "",
    "# BROWSER TRUTH (P4-06 — mandatory constitutional acceptance doctrine)",
    "",
    "> Production browser behaviour is the highest operational acceptance.",
    "> Code compiles · tests pass · deployment succeeds · API responds = engineering evidence only.",
    "",
    "## Browser Truth Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Browser Acceptance Pipeline",
    "Repository Acceptance → Automated Validation → Deployment → Production Browser Verification → Grand King Browser Verification → Mission Complete",
    "",
    acceptanceBlock,
    "---",
    "",
  ].join("\n");
}

export function prependBrowserTruth(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
