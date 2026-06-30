export const ACCOUNT_INFRASTRUCTURE_MODULE_ID = "account-infrastructure-engine" as const;

export type AccountInfrastructureCapability =
  | "account-infrastructure-engine.read"
  | "account-infrastructure-engine.manage"
  | "account-infrastructure-engine.health";

export const ACCOUNT_INFRASTRUCTURE_CAPABILITIES: AccountInfrastructureCapability[] = [
  "account-infrastructure-engine.read",
  "account-infrastructure-engine.manage",
  "account-infrastructure-engine.health",
];

export type AccountInfrastructureModuleContract = {
  moduleId: typeof ACCOUNT_INFRASTRUCTURE_MODULE_ID;
  capabilities: AccountInfrastructureCapability[];
  missionId: "LIVE-002";
  integratesWith: [
    "ecommerce-os-orchestrator",
    "marketplace-infrastructure-engine",
    "empire-governance",
    "grand-kings-dashboard",
  ];
};

export function createAccountInfrastructureModuleContract(): AccountInfrastructureModuleContract {
  return {
    moduleId: ACCOUNT_INFRASTRUCTURE_MODULE_ID,
    capabilities: ACCOUNT_INFRASTRUCTURE_CAPABILITIES,
    missionId: "LIVE-002",
    integratesWith: [
      "ecommerce-os-orchestrator",
      "marketplace-infrastructure-engine",
      "empire-governance",
      "grand-kings-dashboard",
    ],
  };
}
