import { CURSOR_SOVEREIGNTY_NEVER } from "./constitution.js";
import type { ObjectiveEngine } from "./engine.js";
import type { ActionEvaluation, ProposedAction } from "./types.js";

/**
 * Autonomous Runtime Orchestrator (PILLOW-019).
 * Enforces Objective Filter and Cursor Sovereignty preconditions.
 *
 * This orchestrator NEVER dispatches Cursor or modifies the repository.
 * It only determines whether work is objective-aligned enough to reach
 * Grand King approval — execution chain continues only after explicit GK approval.
 *
 * @see EMPIREAI_PILLOW_CONSTITUTION.md — Cursor Sovereignty · Objective Filter
 */
export class AutonomousRuntimeOrchestrator {
  constructor(private readonly objective: ObjectiveEngine) {}

  /** Ask: does this action directly support the active objective? */
  evaluateBeforeAction(action: ProposedAction): ActionEvaluation {
    return this.objective.gateAction(action);
  }

  /** Proceed only when aligned or Grand King override is explicit. */
  prepareForExecution(action: ProposedAction): {
    proceed: boolean;
    evaluation: ActionEvaluation;
  } {
    const evaluation = this.evaluateBeforeAction(action);
    const proceed =
      evaluation.supportsObjective ||
      (action.grandKingOverride === true && evaluation.alignment !== "deferred_not_aligned");

    return { proceed, evaluation };
  }

  shouldShowApprovalToGrandKing(action: ProposedAction): boolean {
    const evaluation = this.evaluateBeforeAction(action);
    if (evaluation.strategicSilence) {
      return false;
    }
    const attention = this.objective.selectAttentionActions([action]);
    if (
      this.objective.isBuilderMode() &&
      attention.length > 0 &&
      attention[0]?.title !== action.title
    ) {
      return false;
    }
    return evaluation.interruptGrandKing && evaluation.supportsObjective;
  }

  /**
   * Whether action may enter the Cursor proposal path (objective-aligned only).
   * Does NOT dispatch Cursor — Grand King approval is always required downstream.
   */
  isEligibleForCursorProposalPath(action: ProposedAction): boolean {
    const { proceed, evaluation } = this.prepareForExecution(action);
    return proceed && evaluation.alignment !== "deferred_not_aligned";
  }

  /** @deprecated Use isEligibleForCursorProposalPath — Pillow never auto-dispatches Cursor. */
  shouldDispatchToCursor(action: ProposedAction): boolean {
    return this.isEligibleForCursorProposalPath(action);
  }

  /** Constitutional prohibitions — runtime must never violate these. */
  static cursorSovereigntyProhibitions(): readonly string[] {
    return CURSOR_SOVEREIGNTY_NEVER;
  }
}

export function createAutonomousRuntimeOrchestrator(
  objective: ObjectiveEngine,
): AutonomousRuntimeOrchestrator {
  return new AutonomousRuntimeOrchestrator(objective);
}
