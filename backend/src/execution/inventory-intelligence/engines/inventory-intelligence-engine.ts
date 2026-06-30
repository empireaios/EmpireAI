import type { InventoryIntelligenceRecord } from "../models/inventory-intelligence-record.js";
import type { InventoryIntelligenceRepository } from "../repositories/inventory-intelligence-repository.js";
import {
  generateInventoryPrediction,
  type InventoryIntelligenceInput,
} from "../scoring/inventory-intelligence-scoring.js";

/** Generates inventory intelligence from brand and product inputs. */
export class InventoryIntelligenceEngine {
  constructor(private readonly repository: InventoryIntelligenceRepository) {}

  generatePrediction(input: InventoryIntelligenceInput) {
    return generateInventoryPrediction(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: InventoryIntelligenceInput,
  ): Promise<InventoryIntelligenceRecord> {
    const breakdown = generateInventoryPrediction(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultInventoryIntelligenceEngine = {
  generatePrediction: generateInventoryPrediction,
};

export type { InventoryIntelligenceInput };
