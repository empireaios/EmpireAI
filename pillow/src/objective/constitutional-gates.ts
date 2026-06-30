import { BUILDER_MODE_MAX_ATTENTION_ACTIONS } from "./constitution.js";
import type { ActionEvaluation, ProposedAction } from "./types.js";
import { buildActionHaystack, supportsActiveObjective } from "./alignment.js";

/** LAW 4 — scope expansion categories deferred while objective incomplete. */
export const SCOPE_EXPANSION_SIGNALS = [
  "new architecture",
  "new doctrine",
  "new ux",
  "new governance",
  "new feature",
  "architecture expansion",
  "doctrine improvement",
  "ux redesign",
  "governance expansion",
  "commercial expansion",
  "version 2",
] as const;

/**
 * LAW 6 — discovery must materially advance objective, Empire protection, or long-term profit.
 */
export function materiallyAdvancesEmpire(
  action: ProposedAction,
  supportsObjective: boolean,
): { material: boolean; reason: string } {
  if (action.grandKingOverride) {
    return { material: true, reason: "Grand King override — materiality assumed explicit" };
  }

  if (supportsObjective) {
    const haystack = buildActionHaystack(action);
    const protectionSignals = ["security", "recovery", "blocker", "golive", "proof", "validation"];
    if (protectionSignals.some((signal) => haystack.includes(signal))) {
      return { material: true, reason: "Advances objective or Empire protection" };
    }
    if (action.metadata?.materialAdvance === false) {
      return { material: false, reason: "Low materiality — strategic silence applies" };
    }
    return { material: true, reason: "Directly supports active objective" };
  }

  const haystack = buildActionHaystack(action);
  const profitSignals = ["profit", "revenue", "margin", "roi", "commercial readiness"];
  if (profitSignals.some((signal) => haystack.includes(signal))) {
    return { material: true, reason: "Advances long-term profit readiness" };
  }

  return {
    material: false,
    reason: "Does not materially advance objective, Empire protection, or long-term profit",
  };
}

/** LAW 4 — detect scope expansion while objective incomplete. */
export function isScopeExpansion(action: ProposedAction): boolean {
  const haystack = buildActionHaystack(action);
  return SCOPE_EXPANSION_SIGNALS.some((signal) => haystack.includes(signal));
}

/**
 * LAW 5 — Builder Mode surfaces only the highest-value actions requiring attention.
 */
export function selectHighestValueAttentionActions(
  actions: ProposedAction[],
  builderMode: boolean,
  maxActions = BUILDER_MODE_MAX_ATTENTION_ACTIONS,
): ProposedAction[] {
  if (!builderMode || actions.length <= maxActions) {
    return actions.slice(0, maxActions);
  }

  const scored = actions.map((action) => {
    const { supports } = supportsActiveObjective(action, builderMode);
    let score = supports ? 100 : 0;
    if (action.missionId?.toUpperCase().startsWith("PILLOW-01")) score += 20;
    if (buildActionHaystack(action).includes("blocker")) score += 30;
    if (isScopeExpansion(action)) score -= 50;
    return { action, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxActions).map((entry) => entry.action);
}

export function applyStrategicSilence(
  action: ProposedAction,
  evaluation: ActionEvaluation,
  supportsObjective: boolean,
): ActionEvaluation {
  const { material, reason } = materiallyAdvancesEmpire(action, supportsObjective);
  if (material) {
    return { ...evaluation, strategicSilence: false, materialAdvance: true };
  }
  return {
    ...evaluation,
    strategicSilence: true,
    materialAdvance: false,
    interruptGrandKing: false,
    storedInVault: evaluation.storedInVault || !supportsObjective,
    reason: `Strategic silence (Law 6): ${reason}`,
  };
}
