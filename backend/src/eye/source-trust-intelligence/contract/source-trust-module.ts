/**
 * Source Trust Intelligence module — evaluates how trustworthy each intelligence source is.
 */

import { createConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ProductSignalRegistry } from "../../global-product-signals/repositories/product-signal-registry.js";
import type { SignalSource } from "../../global-product-signals/models/signal-source.js";
import { createInMemoryProductSignalRegistry } from "../../global-product-signals/repositories/in-memory-product-signal-registry.js";
import { SourceTrustEngine, type SourceTrustEvaluationInput } from "../engines/source-trust-engine.js";
import type { SourceTrustProfile } from "../models/source-trust-profile.js";
import { scoreSourceTrust, sourceTrustScoring } from "../scoring/source-trust-scoring.js";
import type { SourceTrustRepository, SourceTrustRepositoryQuery } from "../repositories/source-trust-repository.js";
import { createInMemorySourceTrustRepository } from "../repositories/in-memory-source-trust-repository.js";

export const SOURCE_TRUST_INTELLIGENCE_MODULE_ID = "source-trust-intelligence" as const;
export type SourceTrustIntelligenceModuleId = typeof SOURCE_TRUST_INTELLIGENCE_MODULE_ID;

export const SOURCE_TRUST_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type SourceTrustIntelligenceCapability =
  | "source-trust-intelligence.evaluate"
  | "source-trust-intelligence.persist"
  | "source-trust-intelligence.list";

export const SOURCE_TRUST_INTELLIGENCE_CAPABILITIES: readonly SourceTrustIntelligenceCapability[] = [
  "source-trust-intelligence.evaluate",
  "source-trust-intelligence.persist",
  "source-trust-intelligence.list",
] as const;

export type SourceTrustIntelligenceModuleContract = {
  moduleId: SourceTrustIntelligenceModuleId;
  version: string;
  capabilities: readonly SourceTrustIntelligenceCapability[];
};

export const SOURCE_TRUST_INTELLIGENCE_MODULE_CONTRACT: SourceTrustIntelligenceModuleContract = {
  moduleId: SOURCE_TRUST_INTELLIGENCE_MODULE_ID,
  version: SOURCE_TRUST_INTELLIGENCE_MODULE_VERSION,
  capabilities: SOURCE_TRUST_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates source trust evaluation and persistence. */
export class SourceTrustModule {
  readonly contract = SOURCE_TRUST_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: SourceTrustEngine;

  constructor(
    private readonly repository: SourceTrustRepository,
    connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
    productSignalRegistry: ProductSignalRegistry = createInMemoryProductSignalRegistry(),
  ) {
    this.engine = new SourceTrustEngine(connectorRegistry, productSignalRegistry);
  }

  scoreSourceTrust = scoreSourceTrust;
  scoring = sourceTrustScoring;

  async evaluateSourceTrust(
    workspaceId: string,
    input: SourceTrustEvaluationInput,
  ): Promise<SourceTrustProfile> {
    const profileInput = await this.engine.evaluate(workspaceId, input);
    return this.repository.save(workspaceId, profileInput);
  }

  async getSourceTrustProfile(
    workspaceId: string,
    source: SignalSource,
  ): Promise<SourceTrustProfile | null> {
    return this.repository.getBySource(workspaceId, source);
  }

  async listSourceTrustProfiles(
    workspaceId: string,
    filters: Omit<SourceTrustRepositoryQuery, "workspaceId"> = {},
  ): Promise<SourceTrustProfile[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a source trust module with optional custom dependencies. */
export function createSourceTrustModule(
  repository: SourceTrustRepository = createInMemorySourceTrustRepository(),
  connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
  productSignalRegistry: ProductSignalRegistry = createInMemoryProductSignalRegistry(),
): SourceTrustModule {
  return new SourceTrustModule(repository, connectorRegistry, productSignalRegistry);
}

export const sourceTrustModule = createSourceTrustModule();
