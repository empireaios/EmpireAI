import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resolveAlignmentStatus, supportsActiveObjective } from "./alignment.js";
import {
  computeProgress,
  DEFAULT_OBJECTIVE_ID,
  DEFAULT_OBJECTIVE_TITLE,
  derivePhase,
  deriveTasks,
  evaluateSuccessCriteria,
  SUGGESTED_NEXT_OBJECTIVE,
} from "./criteria.js";
import { BUILDER_MODE_CONSTITUTIONAL_RULES, PILLOW_CONSTITUTION_VERSION } from "./constitution.js";
import {
  applyStrategicSilence,
  isScopeExpansion,
  selectHighestValueAttentionActions,
} from "./constitutional-gates.js";
import { computePillowEmpireScore } from "./empire-score.js";
import { ImprovementVault } from "./improvement-vault.js";
import type {
  ActionEvaluation,
  ActiveObjective,
  ObjectiveDashboardState,
  ObjectiveEngineState,
  ObjectiveMissionQueue,
  ObjectiveMissionQueueItem,
  PillowActiveMode,
  ProposedAction,
} from "./types.js";

/** Builder Mode rules — sourced from EMPIREAI_PILLOW_CONSTITUTION.md via constitution.ts */
export const BUILDER_MODE_RULES = [...BUILDER_MODE_CONSTITUTIONAL_RULES];

/**
 * Objective Engine (PILLOW-019) — exactly one active objective at a time.
 */
export class ObjectiveEngine {
  private initializedAt: string | null = null;
  private activeObjectiveId = DEFAULT_OBJECTIVE_ID;
  private activeObjectiveTitle = DEFAULT_OBJECTIVE_TITLE;
  private activeMode: PillowActiveMode = "builder";
  private pendingNextObjective: string | null = null;
  private readonly vault = new ImprovementVault();
  private readonly reader: RepositoryReader;
  private runtimeCriterionOverrides: Record<string, boolean> = {};
  private journeyText = "";

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ObjectiveEngineState> {
    this.journeyText = (await this.reader.readText("JOURNEY.md")) ?? "";
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ObjectiveEngineState {
    if (!this.initializedAt) {
      throw new Error("Objective Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-019",
      status: "ready",
      initializedAt: this.initializedAt,
      activeObjectiveId: this.activeObjectiveId,
      activeMode: this.activeMode,
      vaultSummaryCount: this.vault.summaryCount(),
    };
  }

  getActiveObjective(): ActiveObjective {
    this.ensureReady();
    const criteria = this.buildCriteria();
    const progress = computeProgress(criteria);
    const complete = progress >= 100;
    const { currentTask, nextTask, blockers } = deriveTasks(criteria);

    if (complete && !this.pendingNextObjective) {
      this.pendingNextObjective = SUGGESTED_NEXT_OBJECTIVE;
      this.activeMode = "complete";
    }

    return {
      objectiveId: this.activeObjectiveId,
      title: this.activeObjectiveTitle,
      successCriteria: criteria,
      phase: derivePhase(progress, complete),
      progressPercent: progress,
      currentTask,
      nextTask,
      blockers,
      complete,
    };
  }

  getDashboardState(): ObjectiveDashboardState {
    const objective = this.getActiveObjective();
    const empireScore = computePillowEmpireScore(objective, this.bootstrap);
    const primaryCandidates = selectHighestValueAttentionActions(
      objective.blockers.map((blocker) => ({
        title: blocker,
        summary: blocker,
        tags: ["blocker"],
      })),
      this.isBuilderMode(),
    );
    return {
      currentObjective: objective,
      activeMode: this.activeMode,
      progressPercent: objective.progressPercent,
      currentPhase: objective.phase,
      currentTask: objective.currentTask,
      nextTask: objective.nextTask,
      blockers: objective.blockers,
      deferredImprovementCount: this.vault.summaryCount(),
      objectiveComplete: objective.complete,
      suggestedNextObjective: this.pendingNextObjective,
      builderModeRules: [...BUILDER_MODE_RULES],
      empireScore,
      primaryAttentionAction: primaryCandidates[0]?.title ?? objective.currentTask,
      constitutionalLawsVersion: PILLOW_CONSTITUTION_VERSION,
    };
  }

  getEmpireScore() {
    this.ensureReady();
    return computePillowEmpireScore(this.getActiveObjective(), this.bootstrap);
  }

  /** LAW 5 — highest-value actions requiring Grand King attention in Builder Mode. */
  selectAttentionActions(actions: ProposedAction[]): ProposedAction[] {
    return selectHighestValueAttentionActions(actions, this.isBuilderMode());
  }

  isBuilderMode(): boolean {
    return this.activeMode === "builder";
  }

  evaluateProposedAction(action: ProposedAction): ActionEvaluation {
    this.ensureReady();
    const builderMode = this.isBuilderMode();
    const { supports, reason } = supportsActiveObjective(action, builderMode);
    const alignment = supports
      ? "objective_aligned"
      : action.grandKingOverride
        ? "requires_grand_king_override"
        : builderMode
          ? "blocked_by_current_objective"
          : "deferred_not_aligned";

    return {
      alignment,
      supportsObjective: supports,
      storedInVault: false,
      reason,
      interruptGrandKing: supports && alignment === "objective_aligned",
    };
  }

  /** Builder Mode gate — aligned work proceeds; unrelated work goes to vault (Laws 4 & 6). */
  gateAction(action: ProposedAction): ActionEvaluation {
    const objective = this.getActiveObjective();
    const builderMode = this.isBuilderMode();

    if (builderMode && !objective.complete && isScopeExpansion(action) && !action.grandKingOverride) {
      return this.routeToVault(action, "Finish Before Expand (Law 4): scope expansion deferred");
    }

    const evaluation = this.evaluateProposedAction(action);
    if (evaluation.supportsObjective || action.grandKingOverride) {
      const aligned = {
        ...evaluation,
        alignment: action.grandKingOverride
          ? resolveAlignmentStatus(action, evaluation.supportsObjective)
          : "objective_aligned",
        interruptGrandKing: evaluation.supportsObjective,
      } as ActionEvaluation;
      return applyStrategicSilence(action, aligned, evaluation.supportsObjective);
    }
    return applyStrategicSilence(
      action,
      this.routeToVault(action, evaluation.reason),
      false,
    );
  }

  routeToVault(action: ProposedAction, reason?: string): ActionEvaluation {
    const entry = this.vault.store(action, "deferred");
    return {
      alignment: "deferred_not_aligned",
      supportsObjective: false,
      storedInVault: true,
      vaultEntryId: entry.entryId,
      reason: reason ?? "Stored in Improvement Vault — does not support active objective",
      interruptGrandKing: false,
      strategicSilence: true,
      materialAdvance: false,
    };
  }

  requestObjectiveSwitch(nextObjectiveTitle: string, approvedByGrandKing: boolean): {
    switched: boolean;
    reason: string;
  } {
    if (!approvedByGrandKing) {
      return {
        switched: false,
        reason: "Objective cannot switch without Grand King approval",
      };
    }

    const current = this.getActiveObjective();
    if (!current.complete && nextObjectiveTitle !== this.activeObjectiveTitle) {
      return {
        switched: false,
        reason: "Current objective is not complete — finish Version 1 first",
      };
    }

    this.activeObjectiveId = nextObjectiveTitle.toLowerCase().replace(/\s+/g, "-");
    this.activeObjectiveTitle = nextObjectiveTitle;
    this.activeMode = nextObjectiveTitle.includes("Commercial") ? "exploration" : "builder";
    this.pendingNextObjective = null;
    this.runtimeCriterionOverrides = {};
    return { switched: true, reason: "Objective switched by Grand King approval" };
  }

  setCriterionComplete(criterionId: string, complete: boolean): void {
    this.runtimeCriterionOverrides[criterionId] = complete;
  }

  getVault() {
    return this.vault;
  }

  classifyMissionQueue(
    missions: Array<{ missionId: string; title: string; phase: string }>,
  ): ObjectiveMissionQueue {
    const queue: ObjectiveMissionQueue = {
      activeObjectiveWork: [],
      waitingObjectiveWork: [],
      deferredImprovementVault: [],
      blocked: [],
      completed: [],
    };

    for (const mission of missions) {
      const action: ProposedAction = {
        title: mission.title,
        summary: mission.title,
        missionId: mission.missionId,
      };
      const evaluation = this.evaluateProposedAction(action);
      const item: ObjectiveMissionQueueItem = {
        missionId: mission.missionId,
        title: mission.title,
        bucket: "blocked",
        alignment: evaluation.alignment,
        phase: mission.phase,
      };

      if (mission.phase === "completed") {
        item.bucket = "completed";
        queue.completed.push(item);
        continue;
      }

      if (evaluation.supportsObjective) {
        if (["running", "dispatched", "recovery"].includes(mission.phase)) {
          item.bucket = "active_objective_work";
          queue.activeObjectiveWork.push(item);
        } else {
          item.bucket = "waiting_objective_work";
          queue.waitingObjectiveWork.push(item);
        }
        continue;
      }

      if (evaluation.alignment === "deferred_not_aligned") {
        item.bucket = "deferred_improvement_vault";
        queue.deferredImprovementVault.push(item);
      } else {
        item.bucket = "blocked";
        queue.blocked.push(item);
      }
    }

    return queue;
  }

  refreshJourney(): void {
    void this.reader.readText("JOURNEY.md").then((text) => {
      if (text) this.journeyText = text;
    });
  }

  private buildCriteria() {
    return evaluateSuccessCriteria(this.bootstrap, this.runtimeCriterionOverrides, this.journeyText);
  }

  private ensureReady(): void {
    if (!this.initializedAt) {
      throw new Error("Objective Engine not initialized");
    }
  }
}
