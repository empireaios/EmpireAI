/**
 * Shadow CEO control plane — authoritative cycle state model.
 * Stages never claim completion without evidence fields.
 * Synthetic data is always labelled source: 'synthetic' and never as live profit.
 */

export type ShadowCeoOperatingMode =
  | "OBSERVE"
  | "SYNTHETIC"
  | "READ_ONLY_LIVE"
  | "APPROVAL_REQUIRED"
  | "LIVE_EXECUTION";

/** Default for this mission: synthetic playground only. */
export const DEFAULT_SHADOW_CEO_MODE: ShadowCeoOperatingMode = "SYNTHETIC";

export type ShadowCeoDataSource = "synthetic" | "live" | "derived";

export type EconomicClaimKind = "none" | "synthetic_estimate" | "live_profit";

export type EvidenceBundle = {
  summary: string;
  artifacts: Record<string, unknown>;
  capturedAt: string;
};

/**
 * Completion is a discriminated union: COMPLETED requires evidence.
 * Callers cannot set COMPLETED without an EvidenceBundle.
 */
export type CompletionState =
  | {
      status: "PENDING" | "IN_PROGRESS" | "BLOCKED";
      evidence: null;
      completedAt: null;
    }
  | {
      status: "COMPLETED";
      evidence: EvidenceBundle;
      completedAt: string;
    };

export type RecordBase = {
  id: string;
  /** Stable upsert key — same key → same durable row, no duplication. */
  idempotencyKey: string;
  objectiveId: string;
  source: ShadowCeoDataSource;
  mode: ShadowCeoOperatingMode;
  createdAt: string;
  updatedAt: string;
};

/** A — Objective */
export type Objective = RecordBase & {
  kind: "objective";
  workspaceId: string;
  title: string;
  statement: string;
  /** Synthetic objectives must never use live_profit. */
  economicClaim: EconomicClaimKind;
  completion: CompletionState;
};

/** B — Assessment */
export type Assessment = RecordBase & {
  kind: "assessment";
  situationSummary: string;
  findings: string[];
  risks: string[];
  opportunities: string[];
  completion: CompletionState;
};

/** C — PriorityDecision (one ranked priority item; multiple per objective) */
export type PriorityDecision = RecordBase & {
  kind: "priority_decision";
  assessmentId: string;
  rank: number;
  title: string;
  rationale: string;
  urgency: number;
  economicUpside: number | null;
  requiredAuthority: "shadow_autonomous" | "requires_approval" | "blocked";
  completion: CompletionState;
};

/** D — ExecutiveDecision */
export type ExecutiveDecision = RecordBase & {
  kind: "executive_decision";
  assessmentId: string;
  priorityIds: string[];
  disposition: string;
  rationale: string;
  authority: "shadow_autonomous" | "requires_approval" | "blocked";
  completion: CompletionState;
};

/** E — TaskDelegation */
export type TaskDelegation = RecordBase & {
  kind: "task_delegation";
  decisionId: string;
  priorityId: string | null;
  title: string;
  assignee: string;
  instructions: string;
  /** Task-level action idempotency (also mirrored on Action records). */
  actionIdempotencyKey: string;
  completion: CompletionState;
};

/** F — Approval */
export type Approval = RecordBase & {
  kind: "approval";
  decisionId: string;
  actionId: string | null;
  requestSummary: string;
  requiredApprover: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED";
  decisionNote: string | null;
  completion: CompletionState;
};

/**
 * Executable action (authorized synthetic or approval-gated).
 * Carries its own idempotency key; linked into the chain via decision/task.
 */
export type ShadowCeoAction = RecordBase & {
  kind: "action";
  decisionId: string;
  taskId: string | null;
  approvalId: string | null;
  title: string;
  actionKind: "AUTHORIZED_SYNTHETIC" | "APPROVAL_REQUIRED" | "LIVE";
  executionStatus: "PENDING" | "BLOCKED" | "EXECUTED" | "FAILED";
  /** Forbidden to claim live profit when source === 'synthetic'. */
  economicClaim: EconomicClaimKind;
  resultSummary: string | null;
  completion: CompletionState;
};

/** G — Outcome */
export type Outcome = RecordBase & {
  kind: "outcome";
  decisionId: string;
  actionIds: string[];
  expectedResult: string;
  actualResult: string | null;
  variance: string | null;
  completion: CompletionState;
};

/** H — Lesson */
export type Lesson = RecordBase & {
  kind: "lesson";
  outcomeId: string;
  statement: string;
  confidence: "low" | "medium" | "high";
  conditions: string;
  completion: CompletionState;
};

/** I — Intervention */
export type Intervention = RecordBase & {
  kind: "intervention";
  decisionId: string | null;
  trigger: string;
  actionTaken: string;
  authorityGate: string;
  completion: CompletionState;
};

/** J — ExecutiveReturnBrief */
export type ExecutiveReturnBrief = RecordBase & {
  kind: "executive_return_brief";
  decisionId: string;
  outcomeId: string;
  lessonId: string;
  headline: string;
  whatHappened: string;
  whatWasLearned: string;
  recommendedNext: string;
  completion: CompletionState;
};

export type ShadowCeoRecord =
  | Objective
  | Assessment
  | PriorityDecision
  | ExecutiveDecision
  | TaskDelegation
  | Approval
  | ShadowCeoAction
  | Outcome
  | Lesson
  | Intervention
  | ExecutiveReturnBrief;

export type ShadowCeoRecordKind = ShadowCeoRecord["kind"];

/**
 * Traceable chain:
 * Objective → Assessment → Priority → Decision → Approval? → Task → Completion → Outcome → Lesson → Brief
 */
export type ShadowCeoChain = {
  objectiveId: string;
  objective: Objective;
  assessment: Assessment | null;
  priorities: PriorityDecision[];
  decision: ExecutiveDecision | null;
  approvals: Approval[];
  tasks: TaskDelegation[];
  actions: ShadowCeoAction[];
  interventions: Intervention[];
  outcome: Outcome | null;
  lesson: Lesson | null;
  brief: ExecutiveReturnBrief | null;
};

export type VerticalSliceDemoResult = {
  objectiveId: string;
  chain: ShadowCeoChain;
  created: {
    objective: Objective;
    assessment: Assessment;
    priorities: PriorityDecision[];
    tasks: TaskDelegation[];
    decision: ExecutiveDecision;
    blockedApprovalAction: ShadowCeoAction;
    blockedApproval: Approval;
    authorizedSyntheticAction: ShadowCeoAction;
    outcome: Outcome;
    lesson: Lesson;
    brief: ExecutiveReturnBrief;
  };
};
