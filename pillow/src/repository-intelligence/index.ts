export { ARCHITECTURE_BOUNDARIES } from "./architecture-registry.js";
export { RUNTIME_FLOWS } from "./runtime-flows.js";
export {
  SCREEN_ROUTES,
  indexCodeModules,
  buildArchitectureDependencies,
  findModuleByKeyword,
  findScreenByKeyword,
} from "./code-indexer.js";
export { buildRepositoryKnowledgeModel } from "./knowledge-model.js";
export {
  queryRepositoryKnowledge,
  formatRepositoryKnowledgeAnswer,
} from "./query-engine.js";
export type {
  ArchitectureBoundary,
  CodeModuleEntry,
  DependencyLink,
  RepositoryKnowledgeModel,
  RepositoryKnowledgeQueryAnswer,
  RepositoryKnowledgeQueryResult,
  RuntimeFlow,
  ScreenRouteEntry,
  SystemLayer,
} from "./types.js";
