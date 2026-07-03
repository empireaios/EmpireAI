/**
 * G3-09 — Decision Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadDecisionIntelligenceEngineView,
  type DecisionIntelligenceEngineView,
} from "../../intelligence/decision-intelligence-engine/engine-architecture.js";

export type { DecisionIntelligenceEngineView };
export type {
  DecisionIntelligenceContract,
  DecisionIntelligenceEngineArchitecture,
  DecisionEngineFeed,
} from "../../intelligence/decision-intelligence-engine/engine-architecture.js";

export function loadDecisionIntelligenceEngineViewForWorkspace(
  workspaceId: string,
): DecisionIntelligenceEngineView {
  return loadDecisionIntelligenceEngineView(workspaceId);
}
