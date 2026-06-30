export const COMMERCE_READINESS_ENGINE_MODULE_ID = "commerce-readiness-engine" as const;

export type CommerceReadinessCapability =
  | "commerce-readiness-engine.read"
  | "commerce-readiness-engine.evaluate";

export const COMMERCE_READINESS_CAPABILITIES: CommerceReadinessCapability[] = [
  "commerce-readiness-engine.read",
  "commerce-readiness-engine.evaluate",
];

export type CommerceReadinessModuleContract = {
  moduleId: typeof COMMERCE_READINESS_ENGINE_MODULE_ID;
  capabilities: CommerceReadinessCapability[];
  missionId: "LIVE-004";
  integratesWith: [
    "account-infrastructure-engine",
    "marketplace-connection-engine",
    "ecommerce-os-orchestrator",
    "empire-governance",
    "policy-engine",
  ];
};

export function createCommerceReadinessModuleContract(): CommerceReadinessModuleContract {
  return {
    moduleId: COMMERCE_READINESS_ENGINE_MODULE_ID,
    capabilities: COMMERCE_READINESS_CAPABILITIES,
    missionId: "LIVE-004",
    integratesWith: [
      "account-infrastructure-engine",
      "marketplace-connection-engine",
      "ecommerce-os-orchestrator",
      "empire-governance",
      "policy-engine",
    ],
  };
}
