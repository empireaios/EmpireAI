/**
 * Product Evidence Aggregation module — collective outside-world product evidence.
 */

import type { GlobalProductSignal } from "../../global-product-signals/models/product-signal.js";
import {
  ProductEvidenceAggregationEngine,
  defaultProductEvidenceAggregationEngine,
} from "../engines/product-evidence-aggregation-engine.js";
import type { ProductEvidenceSummary } from "../models/product-evidence-summary.js";
import type { EvidenceAggregationRepository } from "../repositories/evidence-aggregation-repository.js";
import { createInMemoryEvidenceAggregationRepository } from "../repositories/in-memory-evidence-aggregation-repository.js";

export const PRODUCT_EVIDENCE_AGGREGATION_MODULE_ID = "product-evidence-aggregation" as const;
export type ProductEvidenceAggregationModuleId = typeof PRODUCT_EVIDENCE_AGGREGATION_MODULE_ID;

export const PRODUCT_EVIDENCE_AGGREGATION_MODULE_VERSION = "0.1.0" as const;

export type ProductEvidenceAggregationCapability =
  | "product-evidence-aggregation.aggregate"
  | "product-evidence-aggregation.persist"
  | "product-evidence-aggregation.list";

export const PRODUCT_EVIDENCE_AGGREGATION_CAPABILITIES: readonly ProductEvidenceAggregationCapability[] =
  [
    "product-evidence-aggregation.aggregate",
    "product-evidence-aggregation.persist",
    "product-evidence-aggregation.list",
  ] as const;

export type ProductEvidenceAggregationModuleContract = {
  moduleId: ProductEvidenceAggregationModuleId;
  version: string;
  capabilities: readonly ProductEvidenceAggregationCapability[];
};

export const PRODUCT_EVIDENCE_AGGREGATION_MODULE_CONTRACT: ProductEvidenceAggregationModuleContract = {
  moduleId: PRODUCT_EVIDENCE_AGGREGATION_MODULE_ID,
  version: PRODUCT_EVIDENCE_AGGREGATION_MODULE_VERSION,
  capabilities: PRODUCT_EVIDENCE_AGGREGATION_CAPABILITIES,
};

/** Orchestrates product evidence aggregation and persistence. */
export class ProductEvidenceAggregationModule {
  readonly contract = PRODUCT_EVIDENCE_AGGREGATION_MODULE_CONTRACT;

  constructor(
    private readonly repository: EvidenceAggregationRepository,
    private readonly engine: ProductEvidenceAggregationEngine = defaultProductEvidenceAggregationEngine,
  ) {}

  aggregate(productId: string, signals: GlobalProductSignal[]) {
    return this.engine.aggregate(productId, signals);
  }

  async aggregateAndPersist(
    workspaceId: string,
    productId: string,
    signals: GlobalProductSignal[],
  ): Promise<ProductEvidenceSummary> {
    const summaryInput = this.engine.summarize(productId, signals);
    return this.repository.save(workspaceId, summaryInput);
  }

  async getSummary(workspaceId: string, productId: string): Promise<ProductEvidenceSummary | null> {
    return this.repository.getByProductId(workspaceId, productId);
  }

  async listSummaries(
    workspaceId: string,
    filters: { productId?: string; minEvidenceScore?: number } = {},
  ): Promise<ProductEvidenceSummary[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a product evidence aggregation module with optional custom dependencies. */
export function createProductEvidenceAggregationModule(
  repository: EvidenceAggregationRepository = createInMemoryEvidenceAggregationRepository(),
  engine: ProductEvidenceAggregationEngine = defaultProductEvidenceAggregationEngine,
): ProductEvidenceAggregationModule {
  return new ProductEvidenceAggregationModule(repository, engine);
}

export const productEvidenceAggregationModule = createProductEvidenceAggregationModule();
