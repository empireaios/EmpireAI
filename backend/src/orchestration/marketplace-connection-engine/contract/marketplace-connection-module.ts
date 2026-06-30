export const MARKETPLACE_CONNECTION_ENGINE_MODULE_ID = "marketplace-connection-engine" as const;

export type MarketplaceConnectionCapability =
  | "marketplace-connection-engine.read"
  | "marketplace-connection-engine.connect"
  | "marketplace-connection-engine.verify";

export const MARKETPLACE_CONNECTION_CAPABILITIES: MarketplaceConnectionCapability[] = [
  "marketplace-connection-engine.read",
  "marketplace-connection-engine.connect",
  "marketplace-connection-engine.verify",
];

export type MarketplaceConnectionModuleContract = {
  moduleId: typeof MARKETPLACE_CONNECTION_ENGINE_MODULE_ID;
  capabilities: MarketplaceConnectionCapability[];
  missionId: "LIVE-003";
  integratesWith: [
    "account-infrastructure-engine",
    "marketplace-infrastructure-engine",
    "ecommerce-os-orchestrator",
  ];
};

export function createMarketplaceConnectionModuleContract(): MarketplaceConnectionModuleContract {
  return {
    moduleId: MARKETPLACE_CONNECTION_ENGINE_MODULE_ID,
    capabilities: MARKETPLACE_CONNECTION_CAPABILITIES,
    missionId: "LIVE-003",
    integratesWith: [
      "account-infrastructure-engine",
      "marketplace-infrastructure-engine",
      "ecommerce-os-orchestrator",
    ],
  };
}
