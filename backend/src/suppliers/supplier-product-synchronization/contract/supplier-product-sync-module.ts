/**
 * Supplier Product Synchronization module — syncs supplier products into the Product Knowledge Graph.
 */

import type { KnowledgeGraphModule } from "../../../intelligence/product-knowledge-graph/contract/knowledge-graph-module.js";
import { createKnowledgeGraphModule } from "../../../intelligence/product-knowledge-graph/contract/knowledge-graph-module.js";
import {
  SupplierProductSyncEngine,
  defaultSupplierProductSyncEngine,
  type SupplierProductSyncInput,
} from "../engines/supplier-product-sync-engine.js";
import type { SupplierProductSyncRecord } from "../models/supplier-product-sync-record.js";
import {
  buildStubCatalogForPlatform,
  supplierProductSyncScoring,
  syncSupplierCatalog,
  syncSupplierCatalogItem,
} from "../scoring/supplier-product-sync-scoring.js";
import type {
  SupplierProductSyncRepository,
  SupplierProductSyncRepositoryQuery,
} from "../repositories/supplier-product-sync-repository.js";
import { createInMemorySupplierProductSyncRepository } from "../repositories/in-memory-supplier-product-sync-repository.js";

export const SUPPLIER_PRODUCT_SYNC_MODULE_ID = "supplier-product-synchronization" as const;
export type SupplierProductSyncModuleId = typeof SUPPLIER_PRODUCT_SYNC_MODULE_ID;

export const SUPPLIER_PRODUCT_SYNC_MODULE_VERSION = "0.1.0" as const;

export type SupplierProductSyncCapability =
  | "supplier-product-sync.sync"
  | "supplier-product-sync.score"
  | "supplier-product-sync.persist"
  | "supplier-product-sync.list";

export const SUPPLIER_PRODUCT_SYNC_CAPABILITIES: readonly SupplierProductSyncCapability[] = [
  "supplier-product-sync.sync",
  "supplier-product-sync.score",
  "supplier-product-sync.persist",
  "supplier-product-sync.list",
] as const;

export type SupplierProductSyncModuleContract = {
  moduleId: SupplierProductSyncModuleId;
  version: string;
  capabilities: readonly SupplierProductSyncCapability[];
};

export const SUPPLIER_PRODUCT_SYNC_MODULE_CONTRACT: SupplierProductSyncModuleContract = {
  moduleId: SUPPLIER_PRODUCT_SYNC_MODULE_ID,
  version: SUPPLIER_PRODUCT_SYNC_MODULE_VERSION,
  capabilities: SUPPLIER_PRODUCT_SYNC_CAPABILITIES,
};

/** Orchestrates supplier product synchronization and knowledge graph linking. */
export class SupplierProductSyncModule {
  readonly contract = SUPPLIER_PRODUCT_SYNC_MODULE_CONTRACT;
  private readonly engine: SupplierProductSyncEngine;

  constructor(
    private readonly repository: SupplierProductSyncRepository,
    knowledgeGraph: KnowledgeGraphModule = createKnowledgeGraphModule(),
    engine?: SupplierProductSyncEngine,
  ) {
    this.engine =
      engine ?? new SupplierProductSyncEngine(repository, knowledgeGraph);
  }

  syncSupplierCatalog = syncSupplierCatalog;
  syncSupplierCatalogItem = syncSupplierCatalogItem;
  buildStubCatalogForPlatform = buildStubCatalogForPlatform;
  scoring = supplierProductSyncScoring;

  syncSupplierProducts(input: SupplierProductSyncInput) {
    return this.engine.syncSupplierProducts(input);
  }

  async persistSupplierProductSync(
    workspaceId: string,
    input: SupplierProductSyncInput,
  ): Promise<SupplierProductSyncRecord[]> {
    return this.engine.syncAndSave(workspaceId, input);
  }

  async getSupplierProductSyncRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<SupplierProductSyncRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getSupplierProductSyncBySku(
    workspaceId: string,
    connectorId: string,
    supplierSku: string,
  ): Promise<SupplierProductSyncRecord | null> {
    return this.repository.getBySupplierSku(workspaceId, connectorId, supplierSku);
  }

  async listSupplierProductSyncRecords(
    workspaceId: string,
    filters: Omit<SupplierProductSyncRepositoryQuery, "workspaceId"> = {},
  ): Promise<SupplierProductSyncRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a supplier product sync module with optional custom dependencies. */
export function createSupplierProductSyncModule(
  repository: SupplierProductSyncRepository = createInMemorySupplierProductSyncRepository(),
  knowledgeGraph: KnowledgeGraphModule = createKnowledgeGraphModule(),
  engine?: SupplierProductSyncEngine,
): SupplierProductSyncModule {
  return new SupplierProductSyncModule(repository, knowledgeGraph, engine);
}

export const supplierProductSyncModule = createSupplierProductSyncModule();

export type { SupplierProductSyncInput };

export { defaultSupplierProductSyncEngine };
