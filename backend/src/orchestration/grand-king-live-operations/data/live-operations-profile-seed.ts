/**
 * G7-00 — Grand King operating profile and live environment profile seed (REG-LIVE-OPERATIONS-PROFILE).
 */

import {
  GRAND_KING_COMPANY_ID,
  GRAND_KING_WORKSPACE_ID,
} from "../../../grand-king/constants.js";
import {
  LIVE_OPERATIONS_REGISTRY_VERSION,
  type LiveOperationsRegistryRowBase,
} from "../../../registry/types/live-operations-registry-types.js";

export const LUMINOUSYOU_BRAND_ID = "brand-luminousyou" as const;
export const GRAND_KING_ACCOUNT_HOLDER_ID = "grand-king" as const;

function profileRow(configuration: Record<string, unknown>): LiveOperationsRegistryRowBase {
  return {
    id: String((configuration.grandKingOperatingProfile as { accountHolderId: string })?.accountHolderId ??
      (configuration.liveEnvironmentProfile as { environment: string })?.environment ??
      "profile"),
    name: "Grand King Live Operations Profile",
    description: "Registry-driven Grand King operating or environment profile",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CERTIFICATION-FINAL-READINESS"],
    capabilities: ["live-profile"],
    configuration,
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: false },
    workspaceScope: { scope: "workspace" },
    futureCompatibility: { notes: "Grand King first production operator profile" },
  };
}

export const GRAND_KING_OPERATING_PROFILE_ROW: LiveOperationsRegistryRowBase = {
  id: "live-profile-grand-king-operating",
  name: "Grand King Operating Profile",
  description: "First real production operator — Grand King account, LuminousYou brand",
  status: "VALIDATED",
  version: "1.0.0",
  owner: "pillow:governance",
  dependencies: ["REG-CERTIFICATION-FINAL-READINESS"],
  capabilities: ["live-profile"],
  configuration: {
    grandKingOperatingProfile: {
      schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION,
      profileKind: "grand_king_operating",
      accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      companyId: GRAND_KING_COMPANY_ID,
      brandId: LUMINOUSYOU_BRAND_ID,
      brandName: "LuminousYou",
      accountName: "Grand King",
      isProductionOperator: true,
      certificationProgrammeRef: "G6",
    },
  },
  supportedRegions: [],
  supportedCountries: [],
  validation: { schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION },
  pluginSupport: { allowPluginRegistration: false },
  workspaceScope: { scope: "workspace" },
  futureCompatibility: { notes: "Not a demo or fake tenant — real first operating account" },
};

export const LIVE_ENVIRONMENT_PROFILE_ROW: LiveOperationsRegistryRowBase = {
  id: "live-profile-environment-production",
  name: "Controlled Live Environment Profile",
  description: "Controlled live operating environment for Grand King production operations",
  status: "VALIDATED",
  version: "1.0.0",
  owner: "pillow:governance",
  dependencies: ["REG-CERTIFICATION-FINAL-READINESS"],
  capabilities: ["live-profile"],
  configuration: {
    liveEnvironmentProfile: {
      schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION,
      profileKind: "live_environment",
      environment: "live_controlled",
      controlledLiveBoundary: true,
      requiresProductionCertification: true,
      readinessPolicyRef: "policy:g6-production-readiness-gate",
    },
  },
  supportedRegions: [],
  supportedCountries: [],
  validation: { schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION },
  pluginSupport: { allowPluginRegistration: false },
  workspaceScope: { scope: "global" },
  futureCompatibility: { notes: "Live environment requires G6 certification" },
};

export const LIVE_OPERATIONS_PROFILE_SEED_ROWS: LiveOperationsRegistryRowBase[] = [
  GRAND_KING_OPERATING_PROFILE_ROW,
  LIVE_ENVIRONMENT_PROFILE_ROW,
];
