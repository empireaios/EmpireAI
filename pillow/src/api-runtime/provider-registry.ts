import type { ApiRuntimeConfiguration } from "./configuration.js";
import { APIRT_METADATA_VERSION } from "./paths.js";
import type { ApiStore } from "./api-store.js";
import type { ApiProviderRegistration, ApirtInput, ServiceType } from "./types.js";

export class ProviderRegistry {
  /** Deterministic registration keyed by apiId — upserts structural provider record. */
  registerProvider(
    store: ApiStore,
    input: ApirtInput,
    config: ApiRuntimeConfiguration,
  ): ApiProviderRegistration {
    const apiId = input.apiId!;
    const existing = store.getProvider(apiId);
    const provider: ApiProviderRegistration = {
      apiId,
      provider: input.provider ?? existing?.provider ?? apiId,
      serviceType: (input.serviceType ?? existing?.serviceType ?? "custom_extension") as ServiceType,
      endpoint: input.endpoint ?? existing?.endpoint ?? `https://structural.local/${apiId}`,
      authMethod: input.authMethod ?? existing?.authMethod ?? "none",
      credentialReference:
        input.credentialReference ?? existing?.credentialReference ?? "cred://vault/none",
      apiVersion: input.apiVersion ?? existing?.apiVersion ?? "v1",
      connectionStatus: existing?.connectionStatus ?? "disconnected",
      healthStatus: existing?.healthStatus ?? "unknown",
      rateLimitStatus: existing?.rateLimitStatus ?? "ok",
      retryPolicy: existing?.retryPolicy ?? {
        maxRetries: config.defaultMaxRetries,
        backoffMs: config.defaultBackoffMs,
        retryOnStatuses: [408, 429, 500, 502, 503, 504],
      },
      timeoutPolicy: existing?.timeoutPolicy ?? { timeoutMs: config.defaultTimeoutMs },
      lastSuccessfulRequest: existing?.lastSuccessfulRequest ?? null,
      lastFailedRequest: existing?.lastFailedRequest ?? null,
      auditReference: existing?.auditReference ?? `audit://api-runtime/${apiId}`,
      circuitState: existing?.circuitState ?? "closed",
      metadataVersion: APIRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };
    store.saveProvider(provider);
    return store.getProvider(apiId)!;
  }

  getProvider(store: ApiStore, apiId: string) {
    return store.getProvider(apiId);
  }

  listProviders(store: ApiStore) {
    return store.listProviders();
  }
}
