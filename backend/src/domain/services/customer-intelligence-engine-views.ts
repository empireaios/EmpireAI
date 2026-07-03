/**
 * G3-07 — Customer Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadCustomerIntelligenceEngineView,
  type CustomerIntelligenceEngineView,
} from "../../intelligence/customer-intelligence-engine/engine-architecture.js";

export type { CustomerIntelligenceEngineView };
export type {
  CustomerIntelligenceAnalysisContract,
  CustomerIntelligenceEngineArchitecture,
  CustomerComparisonRow,
} from "../../intelligence/customer-intelligence-engine/engine-architecture.js";

export function loadCustomerIntelligenceEngineViewForWorkspace(
  workspaceId: string,
): CustomerIntelligenceEngineView {
  return loadCustomerIntelligenceEngineView(workspaceId);
}
