import type { DoctrineRepository } from "../repositories/doctrine-repository.js";
import { getDoctrineRepository } from "../repositories/sqlite-doctrine-repository.js";

export const DOCTRINE_ENGINE_MODULE_ID = "doctrine-engine" as const;

export type DoctrineEngineCapability =
  | "doctrine-engine.read"
  | "doctrine-engine.publish"
  | "doctrine-engine.modify"
  | "doctrine-engine.lifecycle"
  | "doctrine-engine.enforce";

export const DOCTRINE_ENGINE_CAPABILITIES: DoctrineEngineCapability[] = [
  "doctrine-engine.read",
  "doctrine-engine.publish",
  "doctrine-engine.modify",
  "doctrine-engine.lifecycle",
  "doctrine-engine.enforce",
];

export type DoctrineModuleContract = {
  moduleId: typeof DOCTRINE_ENGINE_MODULE_ID;
  capabilities: DoctrineEngineCapability[];
  repository: DoctrineRepository;
};

export function createDoctrineModuleContract(): DoctrineModuleContract {
  return {
    moduleId: DOCTRINE_ENGINE_MODULE_ID,
    capabilities: DOCTRINE_ENGINE_CAPABILITIES,
    repository: getDoctrineRepository(),
  };
}
