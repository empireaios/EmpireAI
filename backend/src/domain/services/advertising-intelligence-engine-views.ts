/**
 * G3-06 — Advertising Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadAdvertisingIntelligenceEngineView,
  type AdvertisingIntelligenceEngineView,
} from "../../intelligence/advertising-intelligence-engine/engine-architecture.js";

export type { AdvertisingIntelligenceEngineView };
export type {
  AdvertisingIntelligenceAnalysisContract,
  AdvertisingIntelligenceEngineArchitecture,
  CampaignComparisonRow,
} from "../../intelligence/advertising-intelligence-engine/engine-architecture.js";

export function loadAdvertisingIntelligenceEngineViewForWorkspace(
  workspaceId: string,
): AdvertisingIntelligenceEngineView {
  return loadAdvertisingIntelligenceEngineView(workspaceId);
}
