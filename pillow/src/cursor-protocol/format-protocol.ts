import type { ContextSyncPipelineResult } from "../context-synchronization/types.js";
import { MANDATORY_PROTOCOL_SECTIONS } from "./paths.js";
import type {
  CursorProtocolEnvelope,
  CursorProtocolRequest,
  MissionProgressReport,
  PostMissionReportTemplate,
  ProtocolValidationResult,
} from "./types.js";

export function buildProtocolEnvelope(input: {
  request: CursorProtocolRequest;
  contextPipeline: ContextSyncPipelineResult;
  preMissionChecks: import("./types.js").PreMissionCheckResult[];
}): CursorProtocolEnvelope {
  const { request, contextPipeline, preMissionChecks } = input;
  const pkg = contextPipeline.contextPackage;
  const vctx = contextPipeline.visionPipeline.missionContext;

  return {
    protocolVersion: "P4-04",
    missionId: request.missionId ?? pkg.missionId,
    missionTitle: request.missionTitle ?? pkg.missionPurpose,
    missionPurpose: request.missionPurpose ?? pkg.missionPurpose,
    why: vctx.why,
    what: vctx.what,
    how: vctx.how,
    proof: vctx.proof,
    roadmapItem: pkg.currentRoadmapItem,
    dependencies: request.dependencies ?? pkg.dependencies,
    estimatedCompletionTime: pkg.estimatedDuration,
    kingActionRequired: preMissionChecks.some((c) => c.status === "failed"),
    nextRoadmapItem: inferNextRoadmapItem(pkg.currentRoadmapItem),
    preMissionChecks,
    allPreMissionChecksPassed: preMissionChecks.every(
      (c) => c.status === "passed" || c.status === "degraded",
    ),
  };
}

function inferNextRoadmapItem(current: string): string | null {
  if (current.includes("P4-03")) return "P4-04 — Cursor Protocol";
  if (current.includes("P4-04")) return "P4-05 — Recovery";
  if (current.includes("P4-05")) return "P4-06 — Browser Truth";
  if (current.includes("P4-06")) return "P4-07 — Testing";
  if (current.includes("P4-07")) return "P4-08 — Journey";
  if (current.includes("P4-08")) return "P5-01 — Brain Runtime";
  if (current.includes("P5-01")) return "P5-02 — Production Mode";
  if (current.includes("P5-02")) return "P5-03 — Sessions";
  if (current.includes("P5-03")) return "P5-04 — Monitoring";
  if (current.includes("P5-04")) return "P5-05 — Scaling";
  if (current.includes("P5-05")) return "P5-06 — Performance";
  if (current.includes("P5-06")) return "P6-01 — Execution Control Center";
  if (current.includes("P6-01")) return "P6-02 — Vision Integrity Engine";
  if (current.includes("P6-02")) return "P6-03 — Supervisor";
  if (current.includes("P6-03")) return "P6-04 — Builder Monitor";
  if (current.includes("P6-04")) return "P6-05 — ETA Engine";
  if (current.includes("P6-05")) return "P6-06 — Recovery";
  if (current.includes("P6-06")) return "P6-07 — Automation";
  if (current.includes("P6-07")) return "P7-01 — Founder Shell";
  if (current.includes("P7-01")) return "P7-02 — Cockpit UX";
  return null;
}

export function formatCursorProtocolDocument(
  envelope: CursorProtocolEnvelope,
  implementationBody: string,
  input?: {
    acceptanceCriteria?: string[];
    validationSteps?: string[];
  },
): string {
  const checkLines = envelope.preMissionChecks.map(
    (c) =>
      `- ${c.status === "passed" ? "✅" : c.status === "degraded" ? "⚠️" : "❌"} **${c.label}** — ${c.detail}`,
  );

  const acceptance = input?.acceptanceCriteria ?? [
    "Mission objective achieved",
    "Tests and validation pass",
    "Grand King acceptance recorded",
  ];
  const validation = input?.validationSteps ?? [
    "typecheck",
    "build",
    "test",
    "acceptance criteria verification",
  ];

  return [
    "# CURSOR PROTOCOL (P4-04 — mandatory Builder execution format)",
    "",
    "> Every Builder mission follows this protocol. No mission may bypass it.",
    "",
    "## Pre-Mission Checks",
    ...checkLines,
    "",
    "## Mission Purpose",
    envelope.missionPurpose,
    "",
    "## WHY",
    envelope.why,
    "",
    "## WHAT",
    envelope.what,
    "",
    "## HOW",
    envelope.how,
    "",
    "## PROOF",
    envelope.proof,
    "",
    "## Roadmap Item",
    envelope.roadmapItem,
    "",
    "## Dependencies",
    ...(envelope.dependencies.length
      ? envelope.dependencies.map((d) => `- ${d}`)
      : ["- None — prerequisites satisfied"]),
    "",
    "## Context Synchronization",
    "✅ Context Synchronization complete — see Context Synchronization section below for operational state.",
    "",
    "## Architecture Review",
    "Scope validated against Canonical Architecture · Architecture Law · relevant P3 architecture docs.",
    "",
    "## Repository Review",
    "Changes must conform to Engineering Standards · Repository Structure · minimal diff principle.",
    "",
    "## Risk Review",
    ...envelope.preMissionChecks
      .filter((c) => c.status !== "passed")
      .map((c) => `- [${c.status}] ${c.label}: ${c.detail}`),
    ...(envelope.preMissionChecks.every((c) => c.status === "passed")
      ? ["- Standard engineering risk — verify acceptance before deploy"]
      : []),
    "",
    "## Estimated Completion Time",
    envelope.estimatedCompletionTime,
    "",
    "## King Action Required",
    envelope.kingActionRequired
      ? "**YES** — failed pre-mission checks or irreversible scope requires Grand King approval."
      : "**NO** — standard engineering mission; Grand King acceptance at closeout only.",
    "",
    "---",
    "",
    "## Implementation",
    "",
    implementationBody,
    "",
    "## Validation",
    ...validation.map((v) => `- ${v}`),
    "",
    "## Repository Acceptance",
    "- **Status:** PENDING — requires PASS before mission complete",
    "- Journey synchronized if structural programme change",
    "- Executive Audit evidence per EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md",
    "- No unauthorized constitutional drift",
    "",
    "## Production Acceptance",
    "- **Status:** PENDING — requires PASS before mission complete (P4-06 Browser Truth)",
    "- Production browser verification at https://empire-ai.co when scoped",
    "- Health endpoints 200 when deploy scoped",
    "- Fail closed — no mock-as-live",
    "",
    "## Grand King Acceptance",
    "- **Status:** PENDING — requires PASS before mission complete",
    "- Production browser sign-off — engineering evidence alone is insufficient",
    "- Executive Summary + browser screenshots/recording where applicable",
    "",
    "## Browser Truth (P4-06)",
    "- Mission complete requires Repository PASS · Production PASS · Grand King PASS",
    "- Mandatory evidence: screenshots · production URL · feature tested · observed behaviour",
    "",
    "## Lessons Learned",
    "- Record at mission closeout per Vision Accumulation policy",
    "",
    "## Next Roadmap Item",
    envelope.nextRoadmapItem ?? "Per doctrine register after mission closeout",
    "",
    "### Acceptance Criteria",
    ...acceptance.map((a) => `- ${a}`),
    "",
    "---",
    "",
  ].join("\n");
}

export function prependCursorProtocol(
  existingDocument: string,
  protocolDocument: string,
): string {
  return `${protocolDocument}${existingDocument}`;
}

export function validateProtocolDocument(document: string): ProtocolValidationResult {
  const missingSections: string[] = [];
  const presentSections: string[] = [];

  for (const section of MANDATORY_PROTOCOL_SECTIONS) {
    if (document.includes(section)) {
      presentSections.push(section);
    } else {
      missingSections.push(section);
    }
  }

  return {
    valid: missingSections.length === 0,
    missingSections,
    presentSections,
  };
}

export function buildProgressReport(envelope: CursorProtocolEnvelope): MissionProgressReport {
  return {
    currentProgress: envelope.allPreMissionChecksPassed
      ? "Pre-mission checks complete — ready for implementation"
      : "Blocked — pre-mission checks incomplete",
    elapsedTime: "0m (mission start)",
    estimatedRemainingTime: envelope.estimatedCompletionTime,
    currentRisks: envelope.preMissionChecks
      .filter((c) => c.status !== "passed")
      .map((c) => c.detail),
    blockingReason: envelope.kingActionRequired
      ? "King action or failed checks"
      : null,
    recoveryAttempts: 0,
    currentOwner: "Builder (Cursor) under Pillow supervision",
    currentRoadmapItem: envelope.roadmapItem,
  };
}

export function buildPostMissionReportTemplate(
  envelope: CursorProtocolEnvelope,
): PostMissionReportTemplate {
  return {
    missionSummary: `${envelope.missionId ?? "MISSION"} — ${envelope.missionTitle}`,
    filesModified: "TBD — list at closeout",
    architectureImpact: "TBD — per Architecture Review",
    repositoryImpact: "TBD — per Repository Review",
    productionImpact: "TBD — if production scoped",
    testsExecuted: "TBD — list test commands and results",
    acceptanceStatus: "Pending",
    remainingRisks: envelope.preMissionChecks
      .filter((c) => c.status !== "passed")
      .map((c) => c.label)
      .join("; ") || "None recorded",
    lessonsLearned: "TBD — mission closeout",
    recommendedNextRoadmapItem: envelope.nextRoadmapItem ?? "Per doctrine register",
  };
}
