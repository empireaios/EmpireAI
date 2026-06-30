import type { PolicyRepository } from "../repositories/policy-repository.js";
import { getPolicyRepository } from "../repositories/sqlite-policy-repository.js";

export const POLICY_ENGINE_MODULE_ID = "policy-engine" as const;

export type PolicyEngineCapability =
  | "policy-engine.read"
  | "policy-engine.resolve"
  | "policy-engine.configure"
  | "policy-engine.lifecycle"
  | "policy-engine.enforce";

export const POLICY_ENGINE_CAPABILITIES: PolicyEngineCapability[] = [
  "policy-engine.read",
  "policy-engine.resolve",
  "policy-engine.configure",
  "policy-engine.lifecycle",
  "policy-engine.enforce",
];

export type PolicyModuleContract = {
  moduleId: typeof POLICY_ENGINE_MODULE_ID;
  capabilities: PolicyEngineCapability[];
  repository: PolicyRepository;
};

export function createPolicyModuleContract(): PolicyModuleContract {
  return {
    moduleId: POLICY_ENGINE_MODULE_ID,
    capabilities: POLICY_ENGINE_CAPABILITIES,
    repository: getPolicyRepository(),
  };
}
