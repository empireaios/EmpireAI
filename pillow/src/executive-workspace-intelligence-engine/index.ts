export {
  ExecutiveWorkspaceIntelligenceEngine,
  createExecutiveWorkspaceIntelligenceEngine,
  resetExecutiveWorkspaceIntelligenceForTesting,
} from "./engine.js";
export type { ExecutiveWorkspaceIntelligenceOptions } from "./engine.js";

export {
  buildExecutiveWorkspaceIntelligenceConfiguration,
  DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION,
} from "./configuration.js";
export type { ExecutiveWorkspaceIntelligenceConfiguration } from "./configuration.js";

export {
  EXECUTIVE_WORKSPACE_INTELLIGENCE_SYSTEM_PATH,
  WORKSPACE_INTELLIGENCE_METADATA_VERSION,
  WORKSPACE_CATEGORIES,
} from "./paths.js";

export type {
  ExecutiveWorkspaceIntelligenceState,
  ExecutiveWorkspaceIntelligenceCockpitSnapshot,
  ExecutiveWorkspaceIntelligenceRunReport,
  WorkspaceIntelligenceRecord,
  ExecutiveWorkspaceIntelligenceInput,
  WorkspaceHealthReport,
  WorkspacePerformanceStats,
  WorkspaceSessionRecord,
  WorkspaceCategory,
  WorkspacePriority,
} from "./types.js";
