import type { DecisionRepository } from "../repositories/decision-repository.js";
import { getDecisionRepository } from "../repositories/sqlite-decision-repository.js";

export const DECISION_REGISTRY_MODULE_ID = "decision-registry" as const;

export type DecisionRegistryCapability =
  | "decision-registry.read"
  | "decision-registry.record"
  | "decision-registry.approve"
  | "decision-registry.lifecycle";

export const DECISION_REGISTRY_CAPABILITIES: DecisionRegistryCapability[] = [
  "decision-registry.read",
  "decision-registry.record",
  "decision-registry.approve",
  "decision-registry.lifecycle",
];

export type DecisionRegistryModuleContract = {
  moduleId: typeof DECISION_REGISTRY_MODULE_ID;
  capabilities: DecisionRegistryCapability[];
  repository: DecisionRepository;
};

export function createDecisionRegistryModuleContract(): DecisionRegistryModuleContract {
  return {
    moduleId: DECISION_REGISTRY_MODULE_ID,
    capabilities: DECISION_REGISTRY_CAPABILITIES,
    repository: getDecisionRepository(),
  };
}
