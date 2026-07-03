/**
 * G7-01 — Grand King production workspace Brain module contract.
 */

export const GRAND_KING_PRODUCTION_WORKSPACE_MODULE_ID = "grand-king-production-workspace" as const;

export type GrandKingProductionWorkspaceCapability =
  | "grand-king-production-workspace.overview"
  | "grand-king-production-workspace.status"
  | "grand-king-production-workspace.health"
  | "grand-king-production-workspace.readiness"
  | "grand-king-production-workspace.configuration"
  | "grand-king-production-workspace.dependencies"
  | "grand-king-production-workspace.summary";

export const GRAND_KING_PRODUCTION_WORKSPACE_CAPABILITIES: GrandKingProductionWorkspaceCapability[] = [
  "grand-king-production-workspace.overview",
  "grand-king-production-workspace.status",
  "grand-king-production-workspace.health",
  "grand-king-production-workspace.readiness",
  "grand-king-production-workspace.configuration",
  "grand-king-production-workspace.dependencies",
  "grand-king-production-workspace.summary",
];

export type GrandKingProductionWorkspaceModuleContract = {
  moduleId: typeof GRAND_KING_PRODUCTION_WORKSPACE_MODULE_ID;
  capabilities: GrandKingProductionWorkspaceCapability[];
  missionId: "G7-01";
  programmeStatus: "production-workspace-established";
  integratesWith: ["grand-king-live-operations", "production-certification", "pillow", "ekls", "brain", "registry"];
};

export function createGrandKingProductionWorkspaceModuleContract(): GrandKingProductionWorkspaceModuleContract {
  return {
    moduleId: GRAND_KING_PRODUCTION_WORKSPACE_MODULE_ID,
    capabilities: GRAND_KING_PRODUCTION_WORKSPACE_CAPABILITIES,
    missionId: "G7-01",
    programmeStatus: "production-workspace-established",
    integratesWith: ["grand-king-live-operations", "production-certification", "pillow", "ekls", "brain", "registry"],
  };
}
