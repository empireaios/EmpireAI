/**
 * G7-00 — Live operations registry resolver.
 */

import {
  grandKingOperatingProfileConfigurationSchema,
  liveEnvironmentProfileConfigurationSchema,
  liveOperationDomainConfigurationSchema,
  type LiveOperationsRegistryRowBase,
} from "../../../registry/types/live-operations-registry-types.js";
import {
  REG_LIVE_OPERATIONS_DOMAIN,
  REG_LIVE_OPERATIONS_PROFILE,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import type {
  GrandKingOperatingProfile,
  LiveEnvironmentProfile,
} from "../contracts/live-operations-types.js";

export type ResolvedLiveOperationDomain = {
  domainRowId: string;
  domainId: string;
  operationType: string;
  certificationRegistryRef?: string;
  commerceRegistryRef?: string;
  automationRegistryRef?: string;
  identityRegistryRef?: string;
  readinessPolicyRef?: string;
  providerRef?: string;
};

export function resolveLiveOperationDomains(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): ResolvedLiveOperationDomain[] {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_LIVE_OPERATIONS_DOMAIN, query)
    .rows as LiveOperationsRegistryRowBase[];
  return rows.map((row) => {
    const config = liveOperationDomainConfigurationSchema.parse(row.configuration.liveOperationDomain);
    return {
      domainRowId: row.id,
      domainId: config.domainId,
      operationType: config.operationType,
      certificationRegistryRef: config.certificationRegistryRef,
      commerceRegistryRef: config.commerceRegistryRef,
      automationRegistryRef: config.automationRegistryRef,
      identityRegistryRef: config.identityRegistryRef,
      readinessPolicyRef: config.readinessPolicyRef,
      providerRef: config.providerRef,
    };
  });
}

export function resolveGrandKingOperatingProfile(
  context: RegistryLoaderContext = {},
): GrandKingOperatingProfile {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_LIVE_OPERATIONS_PROFILE).rows as LiveOperationsRegistryRowBase[];
  const row = rows.find((entry) => entry.configuration.grandKingOperatingProfile);
  if (!row) {
    throw new Error("Grand King operating profile not found in REG-LIVE-OPERATIONS-PROFILE");
  }
  const config = grandKingOperatingProfileConfigurationSchema.parse(row.configuration.grandKingOperatingProfile);
  return {
    profileId: row.id,
    accountHolderId: config.accountHolderId,
    workspaceId: config.workspaceId,
    companyId: config.companyId,
    brandId: config.brandId,
    brandName: config.brandName,
    accountName: config.accountName,
    isProductionOperator: true,
    certificationProgrammeRef: config.certificationProgrammeRef,
  };
}

export function resolveLiveEnvironmentProfile(
  context: RegistryLoaderContext = {},
): LiveEnvironmentProfile {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_LIVE_OPERATIONS_PROFILE).rows as LiveOperationsRegistryRowBase[];
  const row = rows.find((entry) => entry.configuration.liveEnvironmentProfile);
  if (!row) {
    throw new Error("Live environment profile not found in REG-LIVE-OPERATIONS-PROFILE");
  }
  const config = liveEnvironmentProfileConfigurationSchema.parse(row.configuration.liveEnvironmentProfile);
  return {
    profileId: row.id,
    environment: config.environment,
    controlledLiveBoundary: true,
    requiresProductionCertification: true,
    readinessPolicyRef: config.readinessPolicyRef,
  };
}

export function listLiveOperationsRegistryIds(): string[] {
  return [REG_LIVE_OPERATIONS_DOMAIN, REG_LIVE_OPERATIONS_PROFILE];
}
