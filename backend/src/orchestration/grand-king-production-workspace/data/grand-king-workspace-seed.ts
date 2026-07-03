/**
 * G7-01 — Grand King production workspace seed (REG-WORKSPACE).
 */

import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { LUMINOUSYOU_BRAND_ID, GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";

export const GRAND_KING_PRODUCTION_WORKSPACE_ROW: ProductionWorkspaceRegistryRowBase = {
  id: "workspace-grand-king-production",
  name: "Grand King Production Workspace",
  description: "Canonical Version 1 production workspace — single operator, no customer multi-tenancy",
  status: "VALIDATED",
  version: "1.0.0",
  owner: "pillow:governance",
  dependencies: [
    "REG-READINESS-POLICY",
    "REG-CONNECTION-PROVIDER",
    "REG-AUTOMATION-WORKFLOW",
    "REG-COMMERCE-POLICY",
  ],
  capabilities: ["production-operate"],
  configuration: {
    productionWorkspace: {
      schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      workspaceName: "Grand King",
      workspaceType: "executive",
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      brandIds: [LUMINOUSYOU_BRAND_ID],
      environment: "production",
      primaryBrand: "LuminousYou",
      readinessPolicyRef: "readiness-policy-grand-king-production",
      commercePolicyRef: "REG-COMMERCE-POLICY",
      automationWorkflowRef: "REG-AUTOMATION-WORKFLOW",
      connectionProviderRefs: [
        "connection-provider-amazon",
        "connection-provider-shopify",
        "connection-provider-stripe",
        "connection-provider-cjdropshipping",
        "connection-provider-meta",
        "connection-provider-google",
        "connection-provider-tiktok",
      ],
      identityRef: "REG-IDENTITY-PROVIDER",
    },
  },
  supportedRegions: [],
  supportedCountries: [],
  validation: { schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION },
  pluginSupport: { allowPluginRegistration: true },
  workspaceScope: { scope: "workspace" },
  futureCompatibility: { notes: "Only one production workspace in Version 1" },
};

export const PRODUCTION_WORKSPACE_SEED_ROWS: ProductionWorkspaceRegistryRowBase[] = [
  GRAND_KING_PRODUCTION_WORKSPACE_ROW,
];
