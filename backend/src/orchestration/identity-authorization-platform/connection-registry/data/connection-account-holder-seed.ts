/**
 * G8-01 — Connection account holder seed (REG-CONNECTION-ACCOUNT-HOLDER).
 */

import {
  CONNECTION_REGISTRY_VERSION,
  type ConnectionRegistryRowBase,
} from "../../../../registry/types/connection-registry-types.js";

const ACCOUNT_HOLDER_TYPES = [
  { id: "grand-king", name: "Grand King", relationshipKind: "owner", ruleRef: "rule:account-holder:grand-king" },
  { id: "future-founder", name: "Future founder/customer", relationshipKind: "customer", ruleRef: "rule:account-holder:founder" },
  { id: "workspace-admin", name: "Workspace admin", relationshipKind: "administrator", ruleRef: "rule:account-holder:admin" },
  { id: "operator", name: "Operator", relationshipKind: "operator", ruleRef: "rule:account-holder:operator" },
  { id: "external-owner", name: "External account owner", relationshipKind: "external", ruleRef: "rule:account-holder:external" },
] as const;

export const CONNECTION_ACCOUNT_HOLDER_SEED_ROWS: ConnectionRegistryRowBase[] = ACCOUNT_HOLDER_TYPES.map(
  (holder) => ({
    id: `connection-account-holder-${holder.id}`,
    name: holder.name,
    description: `Account holder relationship type: ${holder.name}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CONNECTION-PROVIDER"],
    capabilities: ["account-holder"],
    configuration: {
      connectionAccountHolder: {
        schemaVersion: CONNECTION_REGISTRY_VERSION,
        accountHolderTypeId: holder.id,
        accountHolderTypeName: holder.name,
        relationshipKind: holder.relationshipKind,
        eligibilityRuleRef: holder.ruleRef,
        workspaceScoped: true,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CONNECTION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Registry-compatible account holder types" },
  }),
);

export { ACCOUNT_HOLDER_TYPES };
