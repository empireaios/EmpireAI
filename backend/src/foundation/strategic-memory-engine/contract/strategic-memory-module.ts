import type { StrategicMemoryRepository } from "../repositories/strategic-memory-repository.js";
import { getStrategicMemoryRepository } from "../repositories/sqlite-strategic-memory-repository.js";

export const STRATEGIC_MEMORY_ENGINE_MODULE_ID = "strategic-memory-engine" as const;

export type StrategicMemoryEngineCapability =
  | "strategic-memory-engine.read"
  | "strategic-memory-engine.record"
  | "strategic-memory-engine.recall"
  | "strategic-memory-engine.lifecycle";

export const STRATEGIC_MEMORY_ENGINE_CAPABILITIES: StrategicMemoryEngineCapability[] = [
  "strategic-memory-engine.read",
  "strategic-memory-engine.record",
  "strategic-memory-engine.recall",
  "strategic-memory-engine.lifecycle",
];

export type StrategicMemoryEngineModuleContract = {
  moduleId: typeof STRATEGIC_MEMORY_ENGINE_MODULE_ID;
  capabilities: StrategicMemoryEngineCapability[];
  repository: StrategicMemoryRepository;
};

export function createStrategicMemoryEngineModuleContract(): StrategicMemoryEngineModuleContract {
  return {
    moduleId: STRATEGIC_MEMORY_ENGINE_MODULE_ID,
    capabilities: STRATEGIC_MEMORY_ENGINE_CAPABILITIES,
    repository: getStrategicMemoryRepository(),
  };
}
