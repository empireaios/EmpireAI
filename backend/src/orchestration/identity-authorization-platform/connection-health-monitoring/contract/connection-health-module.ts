/**
 * G8-04 — Connection Health Monitoring Brain module contract.
 */

export const CONNECTION_HEALTH_MODULE_ID = "connection-health-monitoring" as const;

export type ConnectionHealthCapability =
  | "connection-health.list"
  | "connection-health.detail"
  | "connection-health.check"
  | "connection-health.summary"
  | "connection-health.attention"
  | "connection-health.matrix";

export const CONNECTION_HEALTH_CAPABILITIES: ConnectionHealthCapability[] = [
  "connection-health.list",
  "connection-health.detail",
  "connection-health.check",
  "connection-health.summary",
  "connection-health.attention",
  "connection-health.matrix",
];

export type ConnectionHealthModuleContract = {
  moduleId: typeof CONNECTION_HEALTH_MODULE_ID;
  capabilities: ConnectionHealthCapability[];
  missionId: "G8-04";
  programmeStatus: "connection-health-monitoring-established";
  integratesWith: [
    "pillow",
    "brain",
    "registry",
    "ekls",
    "connection-registry",
    "authorization-framework",
    "credential-vault-integration",
    "identity-authorization",
  ];
};

export function createConnectionHealthModuleContract(): ConnectionHealthModuleContract {
  return {
    moduleId: CONNECTION_HEALTH_MODULE_ID,
    capabilities: CONNECTION_HEALTH_CAPABILITIES,
    missionId: "G8-04",
    programmeStatus: "connection-health-monitoring-established",
    integratesWith: [
      "pillow",
      "brain",
      "registry",
      "ekls",
      "connection-registry",
      "authorization-framework",
      "credential-vault-integration",
      "identity-authorization",
    ],
  };
}
