/**
 * G3-10 — Executive Intelligence Orchestrator Cockpit / Brain view loader.
 */

import {
  loadExecutiveIntelligenceOrchestratorView,
  type ExecutiveIntelligenceOrchestratorView,
} from "../../intelligence/executive-intelligence-orchestrator/engine-architecture.js";

export type { ExecutiveIntelligenceOrchestratorView };
export type {
  ExecutiveIntelligenceUnifiedService,
  ExecutiveIntelligenceOrchestratorArchitecture,
  ExecutiveIntelligenceConsumerDelivery,
} from "../../intelligence/executive-intelligence-orchestrator/engine-architecture.js";

export function loadExecutiveIntelligenceOrchestratorViewForWorkspace(
  workspaceId: string,
): ExecutiveIntelligenceOrchestratorView {
  return loadExecutiveIntelligenceOrchestratorView(workspaceId);
}
