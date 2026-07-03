/**
 * G3-08 — Risk Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadRiskIntelligenceEngineView,
  type RiskIntelligenceEngineView,
} from "../../intelligence/risk-intelligence-engine/engine-architecture.js";

export type { RiskIntelligenceEngineView };
export type {
  RiskIntelligenceAnalysisContract,
  RiskIntelligenceEngineArchitecture,
  RiskComparisonRow,
} from "../../intelligence/risk-intelligence-engine/engine-architecture.js";

export function loadRiskIntelligenceEngineViewForWorkspace(
  workspaceId: string,
): RiskIntelligenceEngineView {
  return loadRiskIntelligenceEngineView(workspaceId);
}
