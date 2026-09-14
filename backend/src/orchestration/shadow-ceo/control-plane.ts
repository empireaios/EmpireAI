/**
 * Shadow CEO control plane — create/upsert helpers, chain integrity, vertical slice demo.
 */

import { createHash, randomUUID } from "node:crypto";

import { SqliteShadowCeoRepository } from "./repository.js";
import type {
  Approval,
  Assessment,
  CompletionState,
  EvidenceBundle,
  ExecutiveDecision,
  ExecutiveReturnBrief,
  Intervention,
  Lesson,
  Objective,
  Outcome,
  PriorityDecision,
  ShadowCeoAction,
  ShadowCeoChain,
  ShadowCeoOperatingMode,
  ShadowCeoRecord,
  TaskDelegation,
  VerticalSliceDemoResult,
} from "./types.js";
import { DEFAULT_SHADOW_CEO_MODE } from "./types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function stableId(prefix: string, idempotencyKey: string): string {
  const digest = createHash("sha256").update(`${prefix}:${idempotencyKey}`).digest("hex").slice(0, 16);
  return `${prefix}_${digest}`;
}

export function pendingCompletion(): CompletionState {
  return { status: "PENDING", evidence: null, completedAt: null };
}

export function completedWithEvidence(
  evidence: EvidenceBundle,
  completedAt = nowIso(),
): CompletionState {
  if (!evidence.summary?.trim()) {
    throw new Error("COMPLETED status requires non-empty evidence.summary");
  }
  return { status: "COMPLETED", evidence, completedAt };
}

/** Refuse completion claims that lack evidence. */
export function assertCompletable(completion: CompletionState): void {
  if (completion.status === "COMPLETED") {
    if (!completion.evidence || !completion.evidence.summary?.trim()) {
      throw new Error("No stage may claim COMPLETED without evidence fields");
    }
    if (!completion.completedAt) {
      throw new Error("COMPLETED requires completedAt");
    }
  }
}

function assertSyntheticNotLiveProfit(
  source: Objective["source"],
  economicClaim: Objective["economicClaim"],
): void {
  if (source === "synthetic" && economicClaim === "live_profit") {
    throw new Error("Synthetic data must never be labelled as live profit");
  }
}

export type CreateObjectiveInput = {
  workspaceId: string;
  title: string;
  statement: string;
  idempotencyKey: string;
  mode?: ShadowCeoOperatingMode;
  source?: "synthetic" | "live";
  economicClaim?: Objective["economicClaim"];
  completion?: CompletionState;
};

export function buildObjective(input: CreateObjectiveInput): Objective {
  const source = input.source ?? "synthetic";
  const economicClaim = input.economicClaim ?? "none";
  assertSyntheticNotLiveProfit(source, economicClaim);
  const completion = input.completion ?? pendingCompletion();
  assertCompletable(completion);
  const ts = nowIso();
  return {
    kind: "objective",
    id: stableId("obj", input.idempotencyKey),
    idempotencyKey: input.idempotencyKey,
    objectiveId: stableId("obj", input.idempotencyKey),
    workspaceId: input.workspaceId,
    title: input.title,
    statement: input.statement,
    mode: input.mode ?? DEFAULT_SHADOW_CEO_MODE,
    source,
    economicClaim,
    completion,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function loadChain(
  repo: SqliteShadowCeoRepository,
  objectiveId: string,
): ShadowCeoChain | null {
  const objective = repo.getById(objectiveId);
  if (!objective || objective.kind !== "objective") {
    return null;
  }
  const assessments = repo.listByObjectiveAndKind(objectiveId, "assessment");
  const priorities = repo.listByObjectiveAndKind(objectiveId, "priority_decision");
  const decisions = repo.listByObjectiveAndKind(objectiveId, "executive_decision");
  const approvals = repo.listByObjectiveAndKind(objectiveId, "approval");
  const tasks = repo.listByObjectiveAndKind(objectiveId, "task_delegation");
  const actions = repo.listByObjectiveAndKind(objectiveId, "action");
  const interventions = repo.listByObjectiveAndKind(objectiveId, "intervention");
  const outcomes = repo.listByObjectiveAndKind(objectiveId, "outcome");
  const lessons = repo.listByObjectiveAndKind(objectiveId, "lesson");
  const briefs = repo.listByObjectiveAndKind(objectiveId, "executive_return_brief");

  return {
    objectiveId,
    objective,
    assessment: assessments[0] ?? null,
    priorities,
    decision: decisions[0] ?? null,
    approvals,
    tasks,
    actions,
    interventions,
    outcome: outcomes[0] ?? null,
    lesson: lessons[0] ?? null,
    brief: briefs[0] ?? null,
  };
}

export type ChainIntegrityIssue = {
  code: string;
  message: string;
};

/**
 * Verify Objective→Assessment→Priority→Decision→Approval?→Task→…→Brief linkages.
 */
export function verifyChainIntegrity(chain: ShadowCeoChain): ChainIntegrityIssue[] {
  const issues: ChainIntegrityIssue[] = [];
  const { objective, assessment, priorities, decision, approvals, tasks, actions, outcome, lesson, brief } =
    chain;

  if (objective.objectiveId !== objective.id) {
    issues.push({
      code: "OBJECTIVE_ID_MISMATCH",
      message: "Objective.objectiveId must equal Objective.id",
    });
  }

  if (assessment) {
    if (assessment.objectiveId !== objective.id) {
      issues.push({
        code: "ASSESSMENT_ORPHAN",
        message: "Assessment.objectiveId must reference Objective.id",
      });
    }
    assertCompletableSafe(assessment.completion, "assessment", issues);
  }

  for (const p of priorities) {
    if (p.objectiveId !== objective.id) {
      issues.push({ code: "PRIORITY_ORPHAN", message: `Priority ${p.id} wrong objective` });
    }
    if (assessment && p.assessmentId !== assessment.id) {
      issues.push({
        code: "PRIORITY_ASSESSMENT_LINK",
        message: `Priority ${p.id} must reference assessment`,
      });
    }
    assertCompletableSafe(p.completion, `priority:${p.id}`, issues);
  }

  if (decision) {
    if (decision.objectiveId !== objective.id) {
      issues.push({ code: "DECISION_ORPHAN", message: "Decision wrong objective" });
    }
    if (assessment && decision.assessmentId !== assessment.id) {
      issues.push({
        code: "DECISION_ASSESSMENT_LINK",
        message: "Decision must reference assessment",
      });
    }
    assertCompletableSafe(decision.completion, "decision", issues);
  }

  for (const a of approvals) {
    if (decision && a.decisionId !== decision.id) {
      issues.push({
        code: "APPROVAL_DECISION_LINK",
        message: `Approval ${a.id} must reference decision`,
      });
    }
    assertCompletableSafe(a.completion, `approval:${a.id}`, issues);
  }

  for (const t of tasks) {
    if (decision && t.decisionId !== decision.id) {
      issues.push({
        code: "TASK_DECISION_LINK",
        message: `Task ${t.id} must reference decision`,
      });
    }
    assertCompletableSafe(t.completion, `task:${t.id}`, issues);
  }

  for (const act of actions) {
    if (decision && act.decisionId !== decision.id) {
      issues.push({
        code: "ACTION_DECISION_LINK",
        message: `Action ${act.id} must reference decision`,
      });
    }
    if (act.source === "synthetic" && act.economicClaim === "live_profit") {
      issues.push({
        code: "SYNTHETIC_LIVE_PROFIT",
        message: `Action ${act.id} labels synthetic as live profit`,
      });
    }
    assertCompletableSafe(act.completion, `action:${act.id}`, issues);
  }

  if (outcome) {
    if (decision && outcome.decisionId !== decision.id) {
      issues.push({
        code: "OUTCOME_DECISION_LINK",
        message: "Outcome must reference decision",
      });
    }
    assertCompletableSafe(outcome.completion, "outcome", issues);
  }

  if (lesson) {
    if (outcome && lesson.outcomeId !== outcome.id) {
      issues.push({
        code: "LESSON_OUTCOME_LINK",
        message: "Lesson must reference outcome",
      });
    }
    assertCompletableSafe(lesson.completion, "lesson", issues);
  }

  if (brief) {
    if (decision && brief.decisionId !== decision.id) {
      issues.push({ code: "BRIEF_DECISION_LINK", message: "Brief must reference decision" });
    }
    if (outcome && brief.outcomeId !== outcome.id) {
      issues.push({ code: "BRIEF_OUTCOME_LINK", message: "Brief must reference outcome" });
    }
    if (lesson && brief.lessonId !== lesson.id) {
      issues.push({ code: "BRIEF_LESSON_LINK", message: "Brief must reference lesson" });
    }
    assertCompletableSafe(brief.completion, "brief", issues);
  }

  return issues;
}

function assertCompletableSafe(
  completion: CompletionState,
  label: string,
  issues: ChainIntegrityIssue[],
): void {
  try {
    assertCompletable(completion);
  } catch (err) {
    issues.push({
      code: "MISSING_EVIDENCE",
      message: `${label}: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

export type RunVerticalSliceDemoOptions = {
  repo: SqliteShadowCeoRepository;
  workspaceId?: string;
  /** Prefix for all idempotency keys — same prefix + keys → idempotent replay. */
  runKey?: string;
  mode?: ShadowCeoOperatingMode;
  /** Grand King–admitted objective title (arbitrary wording; not fixture-keyed). */
  objectiveTitle?: string;
  /** Grand King–admitted objective statement (preserves user intent). */
  objectiveStatement?: string;
  /** When provided, assessment text is taken from inspected synthetic state. */
  assessmentOverride?: {
    situationSummary: string;
    findings: string[];
    risks: string[];
    opportunities: string[];
  };
};

/**
 * Creates one durable vertical slice:
 * objective → assessment → priorities → decision → 2 tasks →
 * blocked approval-required action → synthetic authorized action →
 * outcome → lesson → brief.
 */
export function runVerticalSliceDemo(
  options: RunVerticalSliceDemoOptions,
): VerticalSliceDemoResult {
  const { repo } = options;
  const runKey = options.runKey ?? "shadow-ceo-vertical-slice-v1";
  const workspaceId = options.workspaceId ?? "ws_shadow_ceo_demo";
  const mode = options.mode ?? DEFAULT_SHADOW_CEO_MODE;
  const ts = nowIso();
  const objectiveTitle =
    options.objectiveTitle?.trim() ||
    "Shadow CEO synthetic control-plane slice";
  const objectiveStatement =
    options.objectiveStatement?.trim() ||
    "Prove durable Objective→…→Brief chain with approval gating and synthetic-labelled actions.";
  const assessmentBody = options.assessmentOverride ?? {
    situationSummary:
      "Synthetic corridor shows weak fulfilment confidence; no live capital at risk.",
    findings: [
      "Fulfilment SLA unknown in synthetic pack",
      "Margin estimate present but unverified",
    ],
    risks: ["Approval-gated spend must remain blocked"],
    opportunities: ["Authorized synthetic monitoring action is safe to execute"],
  };

  const objective = repo.upsert(
    buildObjective({
      workspaceId,
      title: objectiveTitle.slice(0, 240),
      statement: objectiveStatement.slice(0, 8000),
      idempotencyKey: `${runKey}:objective`,
      mode,
      source: "synthetic",
      economicClaim: "none",
      completion: completedWithEvidence({
        summary: "Objective admitted into Shadow CEO SYNTHETIC control plane",
        artifacts: { runKey, workspaceId, admission: "control_plane" },
        capturedAt: ts,
      }),
    }),
  );

  const assessment: Assessment = repo.upsert({
    kind: "assessment",
    id: stableId("asm", `${runKey}:assessment`),
    idempotencyKey: `${runKey}:assessment`,
    objectiveId: objective.id,
    source: "synthetic",
    mode,
    situationSummary: assessmentBody.situationSummary,
    findings: assessmentBody.findings,
    risks: assessmentBody.risks,
    opportunities: assessmentBody.opportunities,
    completion: completedWithEvidence({
      summary: "Assessment complete from inspected synthetic state signals",
      artifacts: {
        findingCount: assessmentBody.findings.length,
        stateBacked: Boolean(options.assessmentOverride),
      },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const priorityA: PriorityDecision = repo.upsert({
    kind: "priority_decision",
    id: stableId("pri", `${runKey}:priority:1`),
    idempotencyKey: `${runKey}:priority:1`,
    objectiveId: objective.id,
    assessmentId: assessment.id,
    source: "synthetic",
    mode,
    rank: 1,
    title: "Clarify fulfilment before any spend",
    rationale: "Unknown SLA dominates downside in synthetic case",
    urgency: 0.8,
    economicUpside: null,
    requiredAuthority: "shadow_autonomous",
    completion: completedWithEvidence({
      summary: "Priority ranked from assessment findings",
      artifacts: { rank: 1 },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const priorityB: PriorityDecision = repo.upsert({
    kind: "priority_decision",
    id: stableId("pri", `${runKey}:priority:2`),
    idempotencyKey: `${runKey}:priority:2`,
    objectiveId: objective.id,
    assessmentId: assessment.id,
    source: "synthetic",
    mode,
    rank: 2,
    title: "Hold supplier spend pending approval",
    rationale: "Spend crosses Shadow CEO synthetic authority",
    urgency: 0.6,
    economicUpside: null,
    requiredAuthority: "requires_approval",
    completion: completedWithEvidence({
      summary: "Spend priority marked requires_approval",
      artifacts: { rank: 2 },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const decision: ExecutiveDecision = repo.upsert({
    kind: "executive_decision",
    id: stableId("dec", `${runKey}:decision`),
    idempotencyKey: `${runKey}:decision`,
    objectiveId: objective.id,
    assessmentId: assessment.id,
    priorityIds: [priorityA.id, priorityB.id],
    source: "synthetic",
    mode,
    disposition: "PROCEED_WITH_SYNTHETIC_MONITOR_AND_BLOCK_SPEND",
    rationale:
      "Execute authorized synthetic monitor; block approval-required supplier spend.",
    authority: "requires_approval",
    completion: completedWithEvidence({
      summary: "Executive decision recorded with dual-track disposition",
      artifacts: { disposition: "PROCEED_WITH_SYNTHETIC_MONITOR_AND_BLOCK_SPEND" },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const task1: TaskDelegation = repo.upsert({
    kind: "task_delegation",
    id: stableId("tsk", `${runKey}:task:1`),
    idempotencyKey: `${runKey}:task:1`,
    objectiveId: objective.id,
    decisionId: decision.id,
    priorityId: priorityA.id,
    source: "synthetic",
    mode,
    title: "Run synthetic fulfilment monitor",
    assignee: "shadow-ceo-agent",
    instructions: "Collect synthetic SLA signals; do not touch live connectors.",
    actionIdempotencyKey: `${runKey}:action:authorized-synthetic`,
    completion: completedWithEvidence({
      summary: "Monitor task delegated",
      artifacts: { assignee: "shadow-ceo-agent" },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const task2: TaskDelegation = repo.upsert({
    kind: "task_delegation",
    id: stableId("tsk", `${runKey}:task:2`),
    idempotencyKey: `${runKey}:task:2`,
    objectiveId: objective.id,
    decisionId: decision.id,
    priorityId: priorityB.id,
    source: "synthetic",
    mode,
    title: "Prepare supplier spend request",
    assignee: "shadow-ceo-agent",
    instructions: "Draft spend packet; execution blocked until approval.",
    actionIdempotencyKey: `${runKey}:action:approval-required`,
    completion: completedWithEvidence({
      summary: "Spend-prep task delegated (execution gated)",
      artifacts: { gated: true },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const blockedApprovalAction: ShadowCeoAction = repo.upsert({
    kind: "action",
    id: stableId("act", `${runKey}:action:approval-required`),
    idempotencyKey: `${runKey}:action:approval-required`,
    objectiveId: objective.id,
    decisionId: decision.id,
    taskId: task2.id,
    approvalId: null,
    source: "synthetic",
    mode: "APPROVAL_REQUIRED",
    title: "Supplier spend (blocked — approval required)",
    actionKind: "APPROVAL_REQUIRED",
    executionStatus: "BLOCKED",
    economicClaim: "none",
    resultSummary: "Blocked pending Grand King approval",
    completion: {
      status: "BLOCKED",
      evidence: null,
      completedAt: null,
    },
    createdAt: ts,
    updatedAt: ts,
  });

  const blockedApproval: Approval = repo.upsert({
    kind: "approval",
    id: stableId("apr", `${runKey}:approval:spend`),
    idempotencyKey: `${runKey}:approval:spend`,
    objectiveId: objective.id,
    decisionId: decision.id,
    actionId: blockedApprovalAction.id,
    source: "synthetic",
    mode: "APPROVAL_REQUIRED",
    requestSummary: "Authorize synthetic-labelled supplier spend (not live profit)",
    requiredApprover: "grand_king",
    approvalStatus: "BLOCKED",
    decisionNote: "No approval granted in SYNTHETIC demo slice",
    completion: {
      status: "BLOCKED",
      evidence: null,
      completedAt: null,
    },
    createdAt: ts,
    updatedAt: ts,
  });

  // Link approval onto the blocked action without changing idempotency key.
  const linkedBlocked: ShadowCeoAction = {
    ...blockedApprovalAction,
    approvalId: blockedApproval.id,
    updatedAt: nowIso(),
  };
  repo.save(linkedBlocked);

  const authorizedSyntheticAction: ShadowCeoAction = repo.upsert({
    kind: "action",
    id: stableId("act", `${runKey}:action:authorized-synthetic`),
    idempotencyKey: `${runKey}:action:authorized-synthetic`,
    objectiveId: objective.id,
    decisionId: decision.id,
    taskId: task1.id,
    approvalId: null,
    source: "synthetic",
    mode,
    title: "Synthetic fulfilment monitor (authorized)",
    actionKind: "AUTHORIZED_SYNTHETIC",
    executionStatus: "EXECUTED",
    economicClaim: "synthetic_estimate",
    resultSummary: "Synthetic SLA signal captured; not live profit",
    completion: completedWithEvidence({
      summary: "Authorized synthetic action executed with labelled source=synthetic",
      artifacts: {
        source: "synthetic",
        economicClaim: "synthetic_estimate",
        liveProfit: false,
      },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const outcome: Outcome = repo.upsert({
    kind: "outcome",
    id: stableId("out", `${runKey}:outcome`),
    idempotencyKey: `${runKey}:outcome`,
    objectiveId: objective.id,
    decisionId: decision.id,
    actionIds: [authorizedSyntheticAction.id, linkedBlocked.id],
    source: "synthetic",
    mode,
    expectedResult: "Monitor runs; spend remains blocked",
    actualResult: "Monitor executed; spend blocked awaiting approval",
    variance: "none",
    completion: completedWithEvidence({
      summary: "Outcome observed from synthetic action results",
      artifacts: {
        executed: authorizedSyntheticAction.id,
        blocked: linkedBlocked.id,
      },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const lesson: Lesson = repo.upsert({
    kind: "lesson",
    id: stableId("les", `${runKey}:lesson`),
    idempotencyKey: `${runKey}:lesson`,
    objectiveId: objective.id,
    outcomeId: outcome.id,
    source: "synthetic",
    mode,
    statement:
      "Approval-required actions must stay BLOCKED in SYNTHETIC mode; authorized synthetic actions may complete with labelled evidence.",
    confidence: "high",
    conditions: "Applies while operating mode is SYNTHETIC or APPROVAL_REQUIRED",
    completion: completedWithEvidence({
      summary: "Lesson extracted from outcome variance=none",
      artifacts: { confidence: "high" },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  const brief: ExecutiveReturnBrief = repo.upsert({
    kind: "executive_return_brief",
    id: stableId("brf", `${runKey}:brief`),
    idempotencyKey: `${runKey}:brief`,
    objectiveId: objective.id,
    decisionId: decision.id,
    outcomeId: outcome.id,
    lessonId: lesson.id,
    source: "synthetic",
    mode,
    headline: "Synthetic control-plane slice durable and gated",
    whatHappened:
      "One objective assessed; two priorities decided; monitor action executed; spend blocked.",
    whatWasLearned: lesson.statement,
    recommendedNext: "Remain in SYNTHETIC until live authority is explicitly granted.",
    completion: completedWithEvidence({
      summary: "Executive return brief sealed with chain evidence",
      artifacts: {
        objectiveId: objective.id,
        decisionId: decision.id,
        outcomeId: outcome.id,
        lessonId: lesson.id,
      },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });

  // Optional intervention record documenting the gate.
  const _intervention: Intervention = repo.upsert({
    kind: "intervention",
    id: stableId("int", `${runKey}:intervention:spend-gate`),
    idempotencyKey: `${runKey}:intervention:spend-gate`,
    objectiveId: objective.id,
    decisionId: decision.id,
    source: "synthetic",
    mode: "APPROVAL_REQUIRED",
    trigger: "Supplier spend requires approval",
    actionTaken: "Blocked execution; opened approval record",
    authorityGate: "grand_king",
    completion: completedWithEvidence({
      summary: "Intervention recorded for approval gate",
      artifacts: { approvalId: blockedApproval.id },
      capturedAt: ts,
    }),
    createdAt: ts,
    updatedAt: ts,
  });
  void _intervention;

  const chain = loadChain(repo, objective.id);
  if (!chain) {
    throw new Error("Failed to reload chain after vertical slice demo");
  }

  return {
    objectiveId: objective.id,
    chain,
    created: {
      objective,
      assessment,
      priorities: [priorityA, priorityB],
      tasks: [task1, task2],
      decision,
      blockedApprovalAction: linkedBlocked,
      blockedApproval,
      authorizedSyntheticAction,
      outcome,
      lesson,
      brief,
    },
  };
}

/** Deterministic helper for tests that need a fresh id without colliding. */
export function newEphemeralId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export type { ShadowCeoRecord };
