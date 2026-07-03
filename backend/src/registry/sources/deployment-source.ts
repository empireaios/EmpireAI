/**
 * EA-003 — Tier 2 deployment registry sources.
 */

import {
  getDeploymentChannelProfile,
  listDeploymentChannelProfiles,
  listV1MandatoryChannels,
  type MarketplaceChannelProfile,
} from "../../intelligence/shared/marketplace-channel-registry.js";
import type { RegistryLoaderContext, RegistryQuery } from "../types/registry-types.js";

export const DEFAULT_DEPLOYMENT_PROFILE_ID = "v1-production";

export type DeploymentProfileRow = {
  deploymentProfileId: string;
  displayName: string;
  channelRegistryIds: string[];
  mandatoryChannelRegistryIds: string[];
  notes: string;
};

export const DEPLOYMENT_PROFILE_ROWS: readonly DeploymentProfileRow[] = [
  {
    deploymentProfileId: DEFAULT_DEPLOYMENT_PROFILE_ID,
    displayName: "Version 1 Production",
    channelRegistryIds: listDeploymentChannelProfiles().map((c) => c.registryId),
    mandatoryChannelRegistryIds: listV1MandatoryChannels().map((c) => c.registryId),
    notes: "ADR-052 · V1_MARKETPLACE_CHANNEL_REGISTRY.md",
  },
];

export function resolveDeploymentProfileId(context: RegistryLoaderContext): string {
  return context.deploymentProfileId ?? DEFAULT_DEPLOYMENT_PROFILE_ID;
}

export function loadDeploymentProfileRows(context: RegistryLoaderContext): DeploymentProfileRow[] {
  const profileId = resolveDeploymentProfileId(context);
  const row = DEPLOYMENT_PROFILE_ROWS.find((p) => p.deploymentProfileId === profileId);
  return row ? [row] : [];
}

export function loadChannelRows(query?: RegistryQuery): MarketplaceChannelProfile[] {
  const channels = listDeploymentChannelProfiles();
  if (query?.registryRowId) {
    const row = getDeploymentChannelProfile(query.registryRowId);
    return row ? [row] : [];
  }
  return channels;
}
