import type { JourneyReadinessPipeline, JourneyRecord } from "./types.js";
import { JOURNEY_MODEL, MISSION_TRACEABILITY_FIELDS } from "./paths.js";

export function formatJourneySystemPreamble(input: {
  readiness: JourneyReadinessPipeline;
  activeJourney?: JourneyRecord | null;
}): string {
  const { readiness, activeJourney } = input;
  const stepLines = readiness.steps.map(
    (s) => `- ${s.status === "passed" ? "✅" : "⚠️"} **${s.label}** — ${s.summary}`,
  );

  const modelLines = JOURNEY_MODEL.map((s) => `- ${s.replace(/_/g, " ")}`);
  const traceFields = MISSION_TRACEABILITY_FIELDS.slice(0, 10).map((f) => `- ${f}`);

  const journeyBlock = activeJourney
    ? [
        "",
        "## Active Journey",
        `- **Journey ID:** ${activeJourney.journeyId}`,
        `- **Roadmap Item:** ${activeJourney.currentRoadmapItem}`,
        `- **Current Step:** ${activeJourney.currentStep}`,
        `- **Progress:** ${activeJourney.progress}%`,
        `- **Timeline Events:** ${activeJourney.timeline.length}`,
      ].join("\n")
    : "";

  return [
    "---",
    "",
    "# JOURNEY SYSTEM (P4-08 — permanent execution history)",
    "",
    "> Journey is NOT a roadmap. Journey is NOT a task list.",
    "> Journey is the permanent execution history of EmpireAI.",
    "> Every constitutional action becomes traceable forever.",
    "",
    "## Journey Readiness",
    ...stepLines,
    "",
    `**Readiness Score:** ${readiness.readinessScore}/100`,
    `**Recommended Action:** ${readiness.recommendedAction}`,
    "",
    "## Journey Model",
    ...modelLines,
    "",
    "## Mission Traceability (mandatory fields)",
    ...traceFields,
    "…",
    journeyBlock,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependJourneySystem(
  existingDocument: string,
  preamble: string,
): string {
  return `${preamble}${existingDocument}`;
}
