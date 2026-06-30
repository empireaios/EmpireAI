/**
 * Inventory Intelligence module — inventory predictions without auto-order.
 */

import {
  InventoryIntelligenceEngine,
  defaultInventoryIntelligenceEngine,
  type InventoryIntelligenceInput,
} from "../engines/inventory-intelligence-engine.js";
import type { InventoryIntelligenceRecord } from "../models/inventory-intelligence-record.js";
import {
  generateInventoryPrediction,
  inventoryIntelligenceScoring,
  type InventoryIntelligenceBrandInput,
  type InventoryIntelligenceProductInput,
} from "../scoring/inventory-intelligence-scoring.js";
import type {
  InventoryIntelligenceRepository,
  InventoryIntelligenceRepositoryQuery,
} from "../repositories/inventory-intelligence-repository.js";
import { createInMemoryInventoryIntelligenceRepository } from "../repositories/in-memory-inventory-intelligence-repository.js";

export const INVENTORY_INTELLIGENCE_MODULE_ID = "inventory-intelligence" as const;
export type InventoryIntelligenceModuleId = typeof INVENTORY_INTELLIGENCE_MODULE_ID;

export const INVENTORY_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type InventoryIntelligenceCapability =
  | "inventory-intelligence.predict"
  | "inventory-intelligence.score"
  | "inventory-intelligence.persist"
  | "inventory-intelligence.list";

export const INVENTORY_INTELLIGENCE_CAPABILITIES: readonly InventoryIntelligenceCapability[] = [
  "inventory-intelligence.predict",
  "inventory-intelligence.score",
  "inventory-intelligence.persist",
  "inventory-intelligence.list",
] as const;

export type InventoryIntelligenceModuleContract = {
  moduleId: InventoryIntelligenceModuleId;
  version: string;
  capabilities: readonly InventoryIntelligenceCapability[];
};

export const INVENTORY_INTELLIGENCE_MODULE_CONTRACT: InventoryIntelligenceModuleContract = {
  moduleId: INVENTORY_INTELLIGENCE_MODULE_ID,
  version: INVENTORY_INTELLIGENCE_MODULE_VERSION,
  capabilities: INVENTORY_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates inventory prediction generation and persistence. */
export class InventoryIntelligenceModule {
  readonly contract = INVENTORY_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: InventoryIntelligenceEngine;

  constructor(
    private readonly repository: InventoryIntelligenceRepository,
    engine?: InventoryIntelligenceEngine,
  ) {
    this.engine = engine ?? new InventoryIntelligenceEngine(repository);
  }

  generateInventoryPrediction = generateInventoryPrediction;
  scoring = inventoryIntelligenceScoring;

  generatePrediction(input: InventoryIntelligenceInput) {
    return this.engine.generatePrediction(input);
  }

  async persistPrediction(
    workspaceId: string,
    input: InventoryIntelligenceInput,
  ): Promise<InventoryIntelligenceRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getPredictionRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<InventoryIntelligenceRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getPredictionByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<InventoryIntelligenceRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listPredictionRecords(
    workspaceId: string,
    filters: Omit<InventoryIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<InventoryIntelligenceRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an inventory intelligence module. */
export function createInventoryIntelligenceModule(
  repository: InventoryIntelligenceRepository = createInMemoryInventoryIntelligenceRepository(),
  engine?: InventoryIntelligenceEngine,
): InventoryIntelligenceModule {
  return new InventoryIntelligenceModule(
    repository,
    engine ?? new InventoryIntelligenceEngine(repository),
  );
}

export const inventoryIntelligenceModule = createInventoryIntelligenceModule();

export type {
  InventoryIntelligenceInput,
  InventoryIntelligenceBrandInput,
  InventoryIntelligenceProductInput,
};

export { defaultInventoryIntelligenceEngine };
