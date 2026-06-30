export const BUSINESS_OPPORTUNITY_WORKSPACE_MODULE_ID = "business-opportunity-workspace" as const;

export type BusinessOpportunityWorkspaceCapability =
  | "business-opportunity-workspace.read"
  | "business-opportunity-workspace.compare"
  | "business-opportunity-workspace.decide";

export const BUSINESS_OPPORTUNITY_WORKSPACE_CAPABILITIES: BusinessOpportunityWorkspaceCapability[] = [
  "business-opportunity-workspace.read",
  "business-opportunity-workspace.compare",
  "business-opportunity-workspace.decide",
];

export function createBusinessOpportunityWorkspaceModuleContract() {
  return {
    moduleId: BUSINESS_OPPORTUNITY_WORKSPACE_MODULE_ID,
    capabilities: BUSINESS_OPPORTUNITY_WORKSPACE_CAPABILITIES,
    missionId: "LIVE-006" as const,
    integratesWith: [
      "product-discovery-opportunity-engine",
      "commerce-readiness-engine",
      "brand-genesis",
    ],
    protection: {
      noProductBuild: true,
      noPublishing: true,
      noAds: true,
      noSupplierCreation: true,
    },
  };
}
