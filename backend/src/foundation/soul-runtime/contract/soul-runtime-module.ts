import type { SoulRuntimeRepository } from "../repositories/soul-runtime-repository.js";
import { getSoulRuntimeRepository } from "../repositories/sqlite-soul-runtime-repository.js";

export const SOUL_RUNTIME_MODULE_ID = "soul-runtime" as const;

export type SoulRuntimeCapability =
  | "soul-runtime.capture"
  | "soul-runtime.list"
  | "soul-runtime.mission"
  | "soul-runtime.doctrine"
  | "soul-runtime.lesson"
  | "soul-runtime.promise"
  | "soul-runtime.roadmap";

export const SOUL_RUNTIME_CAPABILITIES: SoulRuntimeCapability[] = [
  "soul-runtime.capture",
  "soul-runtime.list",
  "soul-runtime.mission",
  "soul-runtime.doctrine",
  "soul-runtime.lesson",
  "soul-runtime.promise",
  "soul-runtime.roadmap",
];

export type SoulRuntimeModuleContract = {
  moduleId: typeof SOUL_RUNTIME_MODULE_ID;
  capabilities: SoulRuntimeCapability[];
  repository: SoulRuntimeRepository;
};

export function createSoulRuntimeModuleContract(): SoulRuntimeModuleContract {
  return {
    moduleId: SOUL_RUNTIME_MODULE_ID,
    capabilities: SOUL_RUNTIME_CAPABILITIES,
    repository: getSoulRuntimeRepository(),
  };
}
