/**
 * G3-05 — Quantitative Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadQuantitativeIntelligenceEngineView,
  type QuantitativeIntelligenceEngineView,
} from "../../intelligence/quantitative-intelligence-engine/engine-architecture.js";

export type { QuantitativeIntelligenceEngineView };
export type {
  QuantitativeModelResultContract,
  QuantitativeIntelligenceEngineArchitecture,
} from "../../intelligence/quantitative-intelligence-engine/engine-architecture.js";

export function loadQuantitativeIntelligenceEngineViewForWorkspace(
  workspaceId: string,
): QuantitativeIntelligenceEngineView {
  return loadQuantitativeIntelligenceEngineView(workspaceId);
}
