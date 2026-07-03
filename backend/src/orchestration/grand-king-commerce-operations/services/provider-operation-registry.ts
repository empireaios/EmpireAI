/**
 * G7-02 — Provider operation registry (registry-driven, no hardcoded execution).
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { resolveProductionWorkspaceConfig } from "../../grand-king-production-workspace/registry/production-workspace-registry-resolver.js";
import { resolveConnectionProviders } from "../../grand-king-production-workspace/registry/production-workspace-registry-resolver.js";

export type ProviderOperationDefinition = {
  providerId: string;
  providerName: string;
  providerKind: string;
  channelType: string;
  operationType: string;
  registryRef: string;
  supportedOperationTypes: string[];
};

export function resolveProviderOperations(context: RegistryLoaderContext = {}): ProviderOperationDefinition[] {
  const workspace = resolveProductionWorkspaceConfig(context);
  const providers = resolveConnectionProviders(context);
  const allowedIds = new Set(
    workspace.connectionProviderRefs.map((ref) => ref.replace("connection-provider-", "")),
  );

  return providers
    .filter((provider) => allowedIds.has(provider.providerId))
    .map((provider) => ({
      providerId: provider.providerId,
      providerName: provider.providerName,
      providerKind: provider.providerKind,
      channelType: provider.channelType ?? provider.providerKind,
      operationType: provider.defaultOperationType ?? "future_operation_type",
      registryRef: provider.registryRef ?? provider.providerId,
      supportedOperationTypes: provider.supportedOperationTypes ?? [],
    }));
}
