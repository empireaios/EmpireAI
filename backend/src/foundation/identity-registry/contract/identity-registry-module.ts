import type { IdentityRegistryRepository } from "../repositories/identity-registry-repository.js";
import { getIdentityRegistryRepository } from "../repositories/sqlite-identity-registry-repository.js";

export const IDENTITY_REGISTRY_MODULE_ID = "identity-registry" as const;

export type IdentityRegistryCapability =
  | "identity-registry.resolve"
  | "identity-registry.read"
  | "identity-registry.register"
  | "identity-registry.rename"
  | "identity-registry.history";

export const IDENTITY_REGISTRY_CAPABILITIES: IdentityRegistryCapability[] = [
  "identity-registry.resolve",
  "identity-registry.read",
  "identity-registry.register",
  "identity-registry.rename",
  "identity-registry.history",
];

export type IdentityRegistryModuleContract = {
  moduleId: typeof IDENTITY_REGISTRY_MODULE_ID;
  capabilities: IdentityRegistryCapability[];
  repository: IdentityRegistryRepository;
};

export function createIdentityRegistryModuleContract(): IdentityRegistryModuleContract {
  return {
    moduleId: IDENTITY_REGISTRY_MODULE_ID,
    capabilities: IDENTITY_REGISTRY_CAPABILITIES,
    repository: getIdentityRegistryRepository(),
  };
}
