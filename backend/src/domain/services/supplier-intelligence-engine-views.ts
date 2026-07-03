/**
 * G3-03 — Supplier Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadSupplierIntelligenceEngineView,
  type SupplierIntelligenceEngineView,
} from "../../intelligence/supplier-intelligence-engine/engine-architecture.js";

export type { SupplierIntelligenceEngineView };
export type {
  SupplierIntelligenceAnalysisContract,
  SupplierIntelligenceEngineArchitecture,
  SupplierComparisonRow,
} from "../../intelligence/supplier-intelligence-engine/engine-architecture.js";

export function loadSupplierIntelligenceEngineViewForWorkspace(
  workspaceId: string,
): SupplierIntelligenceEngineView {
  return loadSupplierIntelligenceEngineView(workspaceId);
}
