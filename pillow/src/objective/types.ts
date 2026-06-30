/** PILLOW-019 — Objective-Driven Autonomous Runtime types. */

import type { ImprovementVaultCategory } from "./constitution.js";
import type { PillowEmpireScore } from "./empire-score.js";

export type PillowActiveMode = "builder" | "exploration" | "complete";

/** Constitution proposal model — Cursor work requires status === approved. */
export type ProposalStatus =
  | "awaiting_grand_king"
  | "approved"
  | "rejected"
  | "deferred";

export interface ImplementationProposal {
  proposalId?: string;
  title: string;
  reason: string;
  businessValue: string;
  profitImpact: string;
  repositoryImpact: string;
  estimatedEngineeringTime: string;
  estimatedOpenAiCost: string;
  infrastructureCost: string;
  opportunityCost: string;
  expectedRoi: string;
  risk: string;
  affectedFiles: string[];
  objectiveAlignment: string;
  recommendation: string;
  /** LAW 2 — Evidence Before Recommendation */
  evidence: string[];
  assumptions: string[];
  confidenceLevel: string;
  alternatives: string[];
  status: ProposalStatus;
  missionId?: string;
  metadata?: Record<string, unknown>;
}

export type ImprovementVaultState =
  | "stored"
  | "deferred"
  | "promoted"
  | "rejected"
  | "ignored_forever";

export type ObjectiveAlignmentStatus =
  | "objective_aligned"
  | "deferred_not_aligned"
  | "requires_grand_king_override"
  | "blocked_by_current_objective";

export interface ObjectiveSuccessCriterion {
  id: string;
  label: string;
  complete: boolean;
}

export interface ActiveObjective {
  objectiveId: string;
  title: string;
  successCriteria: ObjectiveSuccessCriterion[];
  phase: string;
  progressPercent: number;
  currentTask: string | null;
  nextTask: string | null;
  blockers: string[];
  complete: boolean;
}

export interface ProposedAction {
  actionId?: string;
  title: string;
  summary: string;
  missionId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  grandKingOverride?: boolean;
}

export interface ActionEvaluation {
  alignment: ObjectiveAlignmentStatus;
  supportsObjective: boolean;
  storedInVault: boolean;
  vaultEntryId?: string;
  reason: string;
  interruptGrandKing: boolean;
  /** LAW 6 — silent vault routing without interrupting Grand King. */
  strategicSilence?: boolean;
  materialAdvance?: boolean;
}

export interface ObjectiveDashboardState {
  currentObjective: ActiveObjective;
  activeMode: PillowActiveMode;
  progressPercent: number;
  currentPhase: string;
  currentTask: string | null;
  nextTask: string | null;
  blockers: string[];
  deferredImprovementCount: number;
  objectiveComplete: boolean;
  suggestedNextObjective: string | null;
  builderModeRules: string[];
  /** LAW 7 — internal prioritisation signal; never overrides Grand King. */
  empireScore: PillowEmpireScore;
  /** LAW 5 — single highest-value action in Builder Mode. */
  primaryAttentionAction: string | null;
  constitutionalLawsVersion: string;
}

export interface ImprovementVaultEntry {
  entryId: string;
  title: string;
  summary: string;
  state: ImprovementVaultState;
  category: ImprovementVaultCategory;
  sourceActionId?: string;
  storedAt: string;
  tags: string[];
}

export interface ObjectiveEngineState {
  engineVersion: "PILLOW-019";
  status: "ready";
  initializedAt: string;
  activeObjectiveId: string;
  activeMode: PillowActiveMode;
  vaultSummaryCount: number;
}

export type ObjectiveMissionQueueBucket =
  | "active_objective_work"
  | "waiting_objective_work"
  | "deferred_improvement_vault"
  | "blocked"
  | "completed";

export interface ObjectiveMissionQueueItem {
  missionId: string;
  title: string;
  bucket: ObjectiveMissionQueueBucket;
  alignment: ObjectiveAlignmentStatus;
  phase?: string;
}

export interface ObjectiveMissionQueue {
  activeObjectiveWork: ObjectiveMissionQueueItem[];
  waitingObjectiveWork: ObjectiveMissionQueueItem[];
  deferredImprovementVault: ObjectiveMissionQueueItem[];
  blocked: ObjectiveMissionQueueItem[];
  completed: ObjectiveMissionQueueItem[];
}
