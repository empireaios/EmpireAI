import type { StoreBlueprint } from "../models/store-blueprint.js";
import type { StoreBlueprintRepository } from "../repositories/store-blueprint-repository.js";
import {
  scoreStoreBlueprint,
  type StoreBlueprintInput,
} from "../scoring/store-blueprint-scoring.js";

/** Converts brand, portfolio, offer, and content inputs into a complete store blueprint. */
export class StoreBlueprintEngine {
  constructor(private readonly repository: StoreBlueprintRepository) {}

  generateBlueprint(input: StoreBlueprintInput) {
    return scoreStoreBlueprint(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: StoreBlueprintInput,
  ): Promise<StoreBlueprint> {
    const breakdown = scoreStoreBlueprint(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultStoreBlueprintEngine = {
  generateBlueprint: scoreStoreBlueprint,
};

export type { StoreBlueprintInput };
