export {
  FounderShellEngine,
  createFounderShellEngine,
  type FounderShellSurfaces,
} from "./engine.js";
export {
  FOUNDER_SHELL_PATH,
  AUTOMATION_COMPANION_PATH,
  FOUNDER_SHELL_PRINCIPLES,
  FOUNDER_WORKSPACES,
  FOUNDER_NAVIGATION_ORDER,
  FOUNDER_CONTEXT_FIELDS,
} from "./paths.js";
export {
  FOUNDER_NAVIGATION_REGISTRY,
  getFounderNavById,
} from "./navigation-registry.js";
export {
  FOUNDER_WORKSPACE_REGISTRY,
  getFounderWorkspaceById,
} from "./workspace-registry.js";
export {
  buildFounderShellReadinessPipeline,
  buildFounderShellReadinessPipelineSync,
  evaluateFounderShellGate,
} from "./builder-gate.js";
export { formatFounderShellPreamble, prependFounderShell } from "./mission-preamble.js";
export type {
  FounderWorkspaceId,
  FounderNavId,
  FounderContextField,
  FounderShellRequest,
  FounderNavigationItem,
  FounderWorkspaceRecord,
  FounderShellContext,
  ExecutiveHomeSummary,
  FounderShellReadinessPipeline,
  FounderShellGateResult,
  FounderShellEngineState,
  FounderShellAssessment,
  FounderShellMetrics,
} from "./types.js";
