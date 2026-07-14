import type {
  SupervisorReadinessPipeline,
  SupervisorSystemAssessment,
} from "./types.js";

export function formatSupervisorPreamble(input: {
  readiness: SupervisorReadinessPipeline;
  lastAssessment: SupervisorSystemAssessment | null;
}): string {
  const assessment = input.lastAssessment;
  const lines = [
    "## SUPERVISOR SYSTEM (P6-03 — constitutional execution supervision)",
    "",
    "> Supervisor is NOT an AI · NOT Builder · NOT Pillow.",
    "> Supervisor continuously observes every engineering execution.",
    "",
    `**Readiness:** ${input.readiness.readinessScore}/100 · ${input.readiness.recommendedAction}`,
    "",
  ];

  if (assessment) {
    lines.push(
      `**Mission Health:** ${assessment.missionHealth.replace(/_/g, " ")}`,
      `**Supervision:** ${assessment.grandKingSummary}`,
      "",
      "**Principles:** Continuous Observation · No Silent Execution · No Hidden Failure · Evidence-Based Reporting",
      "",
    );
  }

  lines.push(
    "Supervisor observes · ECC coordinates · Builder executes · Guardian monitors infrastructure.",
    "",
  );

  return lines.join("\n");
}

export function prependSupervisorSystem(document: string, preamble: string): string {
  return `${preamble.trim()}\n\n---\n\n${document}`;
}
