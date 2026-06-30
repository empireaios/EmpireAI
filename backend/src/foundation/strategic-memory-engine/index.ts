export {
  STRATEGIC_MEMORY_CATEGORIES,
  STRATEGIC_MEMORY_STATUSES,
  STRATEGIC_MEMORY_LIFECYCLE_EVENTS,
  strategicMemoryEntrySchema,
  validateStrategicMemoryEntry,
  isTerminalMemoryStatus,
} from "./models/strategic-memory.js";
export type {
  StrategicMemoryCategory,
  StrategicMemoryStatus,
  StrategicMemoryLifecycleEvent,
  StrategicMemoryEntry,
  StrategicMemoryLifecycleRecord,
  StrategicMemoryRecordInput,
  StrategicMemoryRecallInput,
  StrategicMemorySummary,
} from "./models/strategic-memory.js";

export type { StrategicMemoryRepository } from "./repositories/strategic-memory-repository.js";
export {
  SqliteStrategicMemoryRepository,
  getStrategicMemoryRepository,
  resetStrategicMemoryRepository,
  createStrategicMemoryLifecycleRecord,
} from "./repositories/sqlite-strategic-memory-repository.js";

export { createDefaultStrategicMemories } from "./services/strategic-memory-default-memories.js";

export {
  StrategicMemoryNotFoundError,
  StrategicMemoryConflictError,
  initializeStrategicMemory,
  recordStrategicMemory,
  modifyStrategicMemory,
  recallStrategicMemories,
  archiveStrategicMemory,
  supersedeStrategicMemory,
  getStrategicMemory,
  listStrategicMemories,
  listStrategicMemoryLifecycle,
  listWorkspaceStrategicMemoryLifecycle,
  getStrategicMemorySummary,
} from "./services/strategic-memory-engine-service.js";

export { registerStrategicMemoryRoutes } from "./routes/strategic-memory-routes.js";
export { strategicMemoryTools } from "./tools/strategic-memory-tools.js";

export {
  STRATEGIC_MEMORY_ENGINE_MODULE_ID,
  STRATEGIC_MEMORY_ENGINE_CAPABILITIES,
  createStrategicMemoryEngineModuleContract,
} from "./contract/strategic-memory-module.js";
export type {
  StrategicMemoryEngineCapability,
  StrategicMemoryEngineModuleContract,
} from "./contract/strategic-memory-module.js";
