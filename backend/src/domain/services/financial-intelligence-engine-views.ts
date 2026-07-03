/**
 * G3-04 — Financial Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadFinancialIntelligenceEngineView,
  type FinancialIntelligenceEngineView,
} from "../../intelligence/financial-intelligence-engine/engine-architecture.js";

export type { FinancialIntelligenceEngineView };
export type {
  FinancialIntelligenceAnalysisContract,
  FinancialIntelligenceEngineArchitecture,
} from "../../intelligence/financial-intelligence-engine/engine-architecture.js";

export function loadFinancialIntelligenceEngineViewForWorkspace(
  workspaceId: string,
): FinancialIntelligenceEngineView {
  return loadFinancialIntelligenceEngineView(workspaceId);
}
