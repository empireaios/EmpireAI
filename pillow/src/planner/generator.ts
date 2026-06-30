import type { MissionCandidate, CursorMissionDocument } from "./types.js";
import { findSequenceEntry } from "./sequencer.js";

function formatDependencySection(
  deps: MissionCandidate["dependencies"],
): string {
  if (deps.length === 0) return "None — prerequisites satisfied per repository.";
  return deps
    .map(
      (d) =>
        `- **${d.id}** — ${d.label}: ${d.satisfied ? "✅ satisfied" : "❌ incomplete"}${d.evidence[0]?.artifact ? ` (${d.evidence[0].artifact})` : ""}`,
    )
    .join("\n");
}

function formatList(items: string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

function formatEvidence(
  evidence: MissionCandidate["evidence"],
): string {
  return evidence
    .map((e) => `- **${e.source}:** ${e.detail}${e.artifact ? ` \`${e.artifact}\`` : ""}`)
    .join("\n");
}

function buildExecutiveSummary(
  candidate: MissionCandidate,
  acceptanceCriteria: string[],
): string {
  const unsatisfied = candidate.dependencies.filter((dep) => !dep.satisfied);
  const riskLines =
    candidate.blockedBy.length > 0
      ? [`Blocked by: ${candidate.blockedBy.join(", ")}`]
      : unsatisfied.length > 0
        ? unsatisfied.map((dep) => `Dependency ${dep.id} not yet satisfied`)
        : ["Dependencies satisfied per repository scan"];

  const recommendation =
    candidate.readiness === "ready" && candidate.blockedBy.length === 0
      ? "**Approve for implementation** — repository evidence supports proceeding after Grand King confirmation."
      : "**Defer or revise** — blocked or incomplete dependencies require Grand King decision before Cursor handoff.";

  return `## SECTION 1 — Executive Summary

> **Audience:** Grand King only. Not implementation instructions.

### My Understanding

Grand King is being asked to authorize **${candidate.id} — ${candidate.title}**: ${candidate.objective}

### Why this recommendation exists

Mission determined by Pillow Mission Planner from repository state — not conversation history.

${formatEvidence(candidate.evidence)}

### Expected Outcome

${acceptanceCriteria.map((item) => `- ${item}`).join("\n")}

### Repository Impact

- **Authority:** ${candidate.authority}
- **Category:** ${candidate.category}
- **Canonical owners:** Journey · relevant contract owners per mission type
- **Runtime/code:** Per Section 2 implementation scope only after approval

### Risk Assessment

${riskLines.map((line) => `- ${line}`).join("\n")}

### Recommendation

${recommendation}
`;
}

function buildCursorDraft(
  candidate: MissionCandidate,
  missionType: string,
  authority: string,
  implementationRules: string[],
  acceptanceCriteria: string[],
  validation: string[],
  executiveAudit: string[],
  stopRule: string,
): string {
  return `## SECTION 2 — Cursor Draft

> **Audience:** Cursor engineering implementation only.

# MISSION: ${candidate.id} — ${candidate.title}

### Mission Type

${missionType}

### Authority

${authority}

PILLOW-002 through PILLOW-005 must be complete before downstream Pillow missions execute planning against repository memory.

================================================================

### Objective

${candidate.objective}

================================================================

### Purpose

Mission determined by Pillow Mission Planner from repository state — not conversation history.

Repository evidence:

${formatEvidence(candidate.evidence)}

================================================================

### Dependencies

${formatDependencySection(candidate.dependencies)}

${candidate.blockedBy.length > 0 ? `\n**Blocked by:** ${candidate.blockedBy.join(", ")}\n` : ""}
================================================================

### Implementation Rules

${formatList(implementationRules)}

================================================================

### Acceptance Criteria

${formatList(acceptanceCriteria)}

================================================================

### Validation

${formatList(validation)}

================================================================

### Executive Audit

${formatList(executiveAudit)}

================================================================

### Stop Rule

${stopRule}
`;
}

export function generateCursorMission(
  candidate: MissionCandidate,
): CursorMissionDocument {
  const sequence = findSequenceEntry(candidate.id);
  const missionType =
    sequence?.missionType ?? "Engineering Operations";

  const implementationRules = sequence?.implementationRules ?? [
    "Repository remains source of truth",
    "Never depend on conversation history",
    "Read-only unless explicitly gated by Approval Gate",
    "Produce Executive Audit at closeout referencing Section 1 Executive Summary",
    "Follow EMPIREAI_CURSOR_OUTPUT_STANDARD.md two-section format",
  ];

  const acceptanceCriteria = sequence?.acceptanceCriteria ?? [
    "Mission objective achieved per authority",
    "Dependencies validated",
    "Repository unchanged unless gated write approved",
    "Validation tests pass",
  ];

  const validation = sequence?.validation ?? [
    "Run applicable typecheck and test suites",
    "Verify read-only behaviour where required",
    "Confirm Journey synchronization if applicable",
  ];

  const executiveAudit = sequence?.executiveAudit ?? [
    "Reference Section 1 Executive Summary for intent traceability",
    "Pre-implementation review",
    "Architecture / sequencing verification",
    "Validation results",
    "Outstanding issues",
    "Executive recommendation",
    "Future Enhancements (BL-C)",
  ];

  const stopRule =
    sequence?.stopRule ??
    "Stop after Executive Audit unless Grand King approves continuation.";

  const authority =
    candidate.authority ??
    sequence?.authority ??
    "PILLOW_ARCHITECTURE_CONTRACT.md";

  const formatted = `# CURSOR OUTPUT: ${candidate.id} — ${candidate.title}

${buildExecutiveSummary(candidate, acceptanceCriteria)}

---

${buildCursorDraft(
  candidate,
  missionType,
  authority,
  implementationRules,
  acceptanceCriteria,
  validation,
  executiveAudit,
  stopRule,
)}
`;

  return {
    missionId: candidate.id,
    title: candidate.title,
    missionType,
    authority,
    objective: candidate.objective,
    dependencies: candidate.dependencies,
    implementationRules,
    acceptanceCriteria,
    validation,
    executiveAudit,
    stopRule,
    evidence: candidate.evidence,
    formatted,
  };
}
