/**
 * G8-01 — Connection Registry Brain module contract.
 */

export const CONNECTION_REGISTRY_MODULE_ID = "connection-registry" as const;

export type ConnectionRegistryCapability =
  | "connection-registry.list"
  | "connection-registry.provider"
  | "connection-registry.requirements"
  | "connection-registry.capabilities"
  | "connection-registry.dependencies"
  | "connection-registry.workspace-profile";

export const CONNECTION_REGISTRY_CAPABILITIES: ConnectionRegistryCapability[] = [
  "connection-registry.list",
  "connection-registry.provider",
  "connection-registry.requirements",
  "connection-registry.capabilities",
  "connection-registry.dependencies",
  "connection-registry.workspace-profile",
];

export type ConnectionRegistryModuleContract = {
  moduleId: typeof CONNECTION_REGISTRY_MODULE_ID;
  capabilities: ConnectionRegistryCapability[];
  missionId: "G8-01";
  programmeStatus: "connection-registry-foundation-established";
  integratesWith: ["pillow", "brain", "registry", "ekls", "identity-authorization"];
};

export function createConnectionRegistryModuleContract(): ConnectionRegistryModuleContract {
  return {
    moduleId: CONNECTION_REGISTRY_MODULE_ID,
    capabilities: CONNECTION_REGISTRY_CAPABILITIES,
    missionId: "G8-01",
    programmeStatus: "connection-registry-foundation-established",
    integratesWith: ["pillow", "brain", "registry", "ekls", "identity-authorization"],
  };
}
