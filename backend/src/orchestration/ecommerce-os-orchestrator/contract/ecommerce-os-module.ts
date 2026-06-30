export const ECOMMERCE_OS_ORCHESTRATOR_MODULE_ID = "ecommerce-os-orchestrator" as const;
export const MARKETPLACE_INFRASTRUCTURE_MODULE_ID = "marketplace-infrastructure-engine" as const;

export type EcommerceOsCapability =
  | "ecommerce-os-orchestrator.read"
  | "ecommerce-os-orchestrator.workflow"
  | "ecommerce-os-orchestrator.approve"
  | "ecommerce-os-orchestrator.launch";

export const ECOMMERCE_OS_CAPABILITIES: EcommerceOsCapability[] = [
  "ecommerce-os-orchestrator.read",
  "ecommerce-os-orchestrator.workflow",
  "ecommerce-os-orchestrator.approve",
  "ecommerce-os-orchestrator.launch",
];

export type MarketplaceInfrastructureCapability =
  | "marketplace-infrastructure-engine.read"
  | "marketplace-infrastructure-engine.connect";

export const MARKETPLACE_INFRASTRUCTURE_CAPABILITIES: MarketplaceInfrastructureCapability[] = [
  "marketplace-infrastructure-engine.read",
  "marketplace-infrastructure-engine.connect",
];

export type EcommerceOsModuleContract = {
  moduleId: typeof ECOMMERCE_OS_ORCHESTRATOR_MODULE_ID;
  capabilities: EcommerceOsCapability[];
  missionId: "LIVE-001";
};

export function createEcommerceOsModuleContract(): EcommerceOsModuleContract {
  return {
    moduleId: ECOMMERCE_OS_ORCHESTRATOR_MODULE_ID,
    capabilities: ECOMMERCE_OS_CAPABILITIES,
    missionId: "LIVE-001",
  };
}
