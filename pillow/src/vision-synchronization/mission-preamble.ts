import type { MissionContextPackage, VisionSyncPipelineResult } from "./types.js";

export function formatMissionPreamble(
  pipeline: VisionSyncPipelineResult,
): string {
  const ctx = pipeline.missionContext;
  const driftLines =
    pipeline.driftFindings.length > 0
      ? pipeline.driftFindings
          .slice(0, 6)
          .map((d) => `- [${d.severity.toUpperCase()}] ${d.signal}`)
      : ["- No drift detected"];

  return [
    "# VISION SYNCHRONIZATION (P4-02 — mandatory mission start)",
    "",
    "> Every Builder mission **begins here**. No implementation until this chain completes.",
    "",
    "## Synchronization Pipeline",
    "",
    ...pipeline.steps.map(
      (s) =>
        `- ${s.status === "complete" ? "✅" : s.status === "degraded" ? "⚠️" : "❌"} **${s.label}** — ${s.summary}`,
    ),
    "",
    "## Mission Context Package",
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Vision Summary | ${ctx.visionSummary.slice(0, 120)} |`,
    `| Current WHY | ${ctx.currentWhy.slice(0, 120)} |`,
    `| Roadmap Item | ${ctx.currentRoadmapItem} |`,
    `| Mission ID | ${ctx.missionId ?? "TBD"} |`,
    `| Estimated Time | ${ctx.estimatedCompletionTime} |`,
    "",
    "### Drift Status",
    ...driftLines,
    "",
    "---",
    "",
    "## WHY",
    ctx.why,
    "",
    "## WHAT",
    ctx.what,
    "",
    "## HOW",
    ctx.how,
    "",
    "## PROOF",
    ctx.proof,
    "",
    "---",
    "",
    "## Mission Generation",
    "",
    "Proceed to implementation only after synchronization status is **complete** or Grand King override is recorded.",
    "",
  ].join("\n");
}

export function prependMissionSynchronization(
  existingDocument: string,
  pipeline: VisionSyncPipelineResult,
): string {
  return `${formatMissionPreamble(pipeline)}\n${existingDocument}`;
}

export function formatMissionContextBrief(ctx: MissionContextPackage): string {
  return [
    "--- Vision Synchronization (PILLOW-VS-001) ---",
    `WHY: ${ctx.why}`,
    `WHAT: ${ctx.what}`,
    `HOW: ${ctx.how}`,
    `PROOF: ${ctx.proof}`,
    `Roadmap: ${ctx.currentRoadmapItem}`,
    `Risks: ${ctx.knownRisks.slice(0, 3).join("; ")}`,
  ].join("\n");
}
