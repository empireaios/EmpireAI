/**
 * G3-02 — Market Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadMarketIntelligenceEngineView,
  type MarketIntelligenceEngineView,
} from "../../intelligence/market-intelligence-engine/engine-architecture.js";

export type { MarketIntelligenceEngineView };
export type {
  MarketIntelligenceAnalysisContract,
  MarketIntelligenceEngineArchitecture,
  MarketplaceComparisonRow,
} from "../../intelligence/market-intelligence-engine/engine-architecture.js";

export function loadMarketIntelligenceEngineViewForWorkspace(
  _workspaceId: string,
): MarketIntelligenceEngineView {
  return loadMarketIntelligenceEngineView();
}
