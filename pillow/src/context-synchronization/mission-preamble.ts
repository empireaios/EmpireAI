import type { ContextPackage, ContextSyncPipelineResult } from "./types.js";

export function formatContextPreamble(pipeline: ContextSyncPipelineResult): string {
  const pkg = pipeline.contextPackage;
  const alignmentLines =
    pipeline.alignmentFindings.length > 0
      ? pipeline.alignmentFindings
          .slice(0, 6)
          .map((f) => `- [${f.severity.toUpperCase()}] ${f.signal}`)
      : ["- Context aligned — no misalignment detected"];

  return [
    "# CONTEXT SYNCHRONIZATION (P4-03 — mandatory before implementation)",
    "",
    "> Vision defines WHY. **Context defines CURRENT STATE.** No implementation until this package loads.",
    "",
    "## Context Synchronization Pipeline",
    "",
    ...pipeline.steps.map(
      (s) =>
        `- ${s.status === "complete" ? "✅" : s.status === "degraded" ? "⚠️" : "❌"} **${s.label}** — ${s.summary}`,
    ),
    "",
    "## Context Package",
    "",
    "| Field | Value |",
    "|-------|-------|",
    `| Roadmap Item | ${pkg.currentRoadmapItem} |`,
    `| Current Phase | ${pkg.currentPhase} |`,
    `| Mission Purpose | ${pkg.missionPurpose.slice(0, 100)} |`,
    `| Completeness | ${pipeline.contextCompletenessPercent}% |`,
    `| Architecture | ${pipeline.architectureVersion.slice(0, 80)} |`,
    `| Repository Version | ${pipeline.repositoryVersion ?? "—"} |`,
    `| Production | ${pipeline.productionAlignment.slice(0, 80)} |`,
    "",
    "### Relevant Vision",
    pkg.relevantVision.slice(0, 200),
    "",
    "### Relevant Soul",
    pkg.relevantSoul.slice(0, 200),
    "",
    "### Constitutional Articles",
    ...pkg.constitutionalArticles.map((a) => `- ${a}`),
    "",
    "### Repository Areas",
    ...pkg.relevantRepositoryAreas.slice(0, 6).map((a) => `- ${a}`),
    "",
    "### Production Components",
    ...pkg.relevantProductionComponents.map((c) => `- ${c}`),
    "",
    "### Lessons · Risks · Dependencies",
    ...pkg.relevantLessons.slice(0, 4).map((l) => `- Lesson: ${l}`),
    ...pkg.knownRisks.slice(0, 4).map((r) => `- Risk: ${r}`),
    ...pkg.dependencies.slice(0, 4).map((d) => `- Dependency: ${d}`),
    "",
    "### Alignment Status",
    ...alignmentLines,
    "",
    "### Acceptance · Duration",
    ...pkg.acceptanceCriteria.slice(0, 4).map((a) => `- ${a}`),
    `- Estimated duration: ${pkg.estimatedDuration}`,
    "",
    "---",
    "",
  ].join("\n");
}

export function prependContextSynchronization(
  existingDocument: string,
  pipeline: ContextSyncPipelineResult,
): string {
  return `${formatContextPreamble(pipeline)}${existingDocument}`;
}

export function formatContextPackageBrief(pkg: ContextPackage): string {
  return [
    "--- Context Synchronization (PILLOW-CS-001) ---",
    `Phase: ${pkg.currentPhase}`,
    `Roadmap: ${pkg.currentRoadmapItem}`,
    `Purpose: ${pkg.missionPurpose}`,
    `Mission: ${pkg.missionId ?? "TBD"}`,
  ].join("\n");
}
