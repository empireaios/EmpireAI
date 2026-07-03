/**
 * G8-08 — Isolation policy resolver (registry-driven).
 */

import {
  REG_AUTHORIZATION_PROVIDER,
  REG_CONNECTION_ACCOUNT_HOLDER,
  REG_CONNECTION_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_IDENTITY_PROVIDER,
  REG_READINESS_POLICY,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  connectionAccountHolderConfigurationSchema,
  type ConnectionRegistryRowBase,
} from "../../../../registry/types/connection-registry-types.js";
import {
  authorizationProviderConfigurationSchema,
  connectionPolicyConfigurationSchema,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../../registry/types/identity-authorization-registry-types.js";
import { readinessPolicyConfigurationSchema, identityProviderConfigurationSchema, type ProductionWorkspaceRegistryRowBase } from "../../../../registry/types/production-workspace-registry-types.js";
import type { VisibilityScope } from "../contracts/isolation-types.js";
import { listIsolationPluginsByKind } from "../plugins/isolation-plugin-host.js";

export type AccountHolderIsolationProfile = {
  accountHolderTypeId: string;
  accountHolderTypeName: string;
  relationshipKind: string;
  eligibilityRuleRef: string;
  workspaceScoped: boolean;
  defaultVisibilityScope: VisibilityScope;
};

export type IsolationPolicyProfile = {
  workspaceId: string;
  accountHolders: AccountHolderIsolationProfile[];
  providerPolicyRefs: string[];
  readinessPolicyIds: string[];
  identityProviderRefs: string[];
  authorizationProviderRefs: string[];
  registryRefs: string[];
};

const RELATIONSHIP_VISIBILITY: Record<string, VisibilityScope> = {
  owner: "grand_king_visible",
  customer: "workspace_visible",
  administrator: "workspace_visible",
  operator: "operator_visible",
  external: "private_to_account_holder",
};

export function resolveVisibilityScopeForRelationship(relationshipKind: string): VisibilityScope {
  const plugins = listIsolationPluginsByKind("visibility_provider");
  void plugins;
  return RELATIONSHIP_VISIBILITY[relationshipKind] ?? "pillow_governed";
}

export function resolveAccountHolderIsolationProfiles(context: RegistryLoaderContext = {}): AccountHolderIsolationProfile[] {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_ACCOUNT_HOLDER).rows as ConnectionRegistryRowBase[];
  return rows.map((row) => {
    const holder = connectionAccountHolderConfigurationSchema.parse(row.configuration.connectionAccountHolder);
    return {
      accountHolderTypeId: holder.accountHolderTypeId,
      accountHolderTypeName: holder.accountHolderTypeName,
      relationshipKind: holder.relationshipKind,
      eligibilityRuleRef: holder.eligibilityRuleRef,
      workspaceScoped: holder.workspaceScoped,
      defaultVisibilityScope: resolveVisibilityScopeForRelationship(holder.relationshipKind),
    };
  });
}

export function resolveAccountHolderProfile(
  accountHolderTypeId: string,
  context: RegistryLoaderContext = {},
): AccountHolderIsolationProfile | undefined {
  return resolveAccountHolderIsolationProfiles(context).find((h) => h.accountHolderTypeId === accountHolderTypeId);
}

export function resolveIsolationPolicyProfile(context: RegistryLoaderContext = {}): IsolationPolicyProfile {
  const loader = getRegistryLoader();
  const workspaceId = context.workspaceId ?? "ws_empire_1";
  const accountHolders = resolveAccountHolderIsolationProfiles(context);
  const policyRows = loader.resolve(context, REG_CONNECTION_POLICY).rows as IdentityAuthorizationRegistryRowBase[];
  const providerPolicyRefs = policyRows.map(
    (row) => connectionPolicyConfigurationSchema.parse(row.configuration.connectionPolicy).policyId,
  );
  const readinessRows = loader.resolve(context, REG_READINESS_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  const readinessPolicyIds = readinessRows.map(
    (row) => readinessPolicyConfigurationSchema.parse(row.configuration.readinessPolicy).policyId,
  );
  const identityRows = loader.resolve(context, REG_IDENTITY_PROVIDER).rows as IdentityAuthorizationRegistryRowBase[];
  const identityProviderRefs = identityRows.map(
    (row) => identityProviderConfigurationSchema.parse(row.configuration.identityProvider).providerId,
  );
  const authRows = loader.resolve(context, REG_AUTHORIZATION_PROVIDER).rows as IdentityAuthorizationRegistryRowBase[];
  const authorizationProviderRefs = authRows.map(
    (row) => authorizationProviderConfigurationSchema.parse(row.configuration.authorizationProvider).providerId,
  );

  return {
    workspaceId,
    accountHolders,
    providerPolicyRefs,
    readinessPolicyIds,
    identityProviderRefs,
    authorizationProviderRefs,
    registryRefs: [
      "REG-CONNECTION-ACCOUNT-HOLDER",
      "REG-CONNECTION-POLICY",
      "REG-CONNECTION-PROVIDER",
      "REG-READINESS-POLICY",
      ...(identityProviderRefs.length > 0 ? ["REG-IDENTITY-PROVIDER"] : []),
      ...(authorizationProviderRefs.length > 0 ? ["REG-AUTHORIZATION-PROVIDER"] : []),
    ],
  };
}

export function resolveAccessPolicyForHolder(accountHolderTypeId: string, context: RegistryLoaderContext = {}): string {
  const profile = resolveAccountHolderProfile(accountHolderTypeId, context);
  return profile?.eligibilityRuleRef ?? "policy:isolation:pillow-governed";
}
