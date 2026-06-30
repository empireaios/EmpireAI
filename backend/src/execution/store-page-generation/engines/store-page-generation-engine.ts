import type { RenderableStorePage } from "../models/renderable-store-page.js";
import type { StorePageRepository } from "../repositories/store-page-repository.js";
import {
  scoreStorePageGeneration,
  type StorePageGenerationInput,
} from "../scoring/store-page-generation-scoring.js";

/** Converts store blueprints into renderable storefront pages. */
export class StorePageGenerationEngine {
  constructor(private readonly repository: StorePageRepository) {}

  generatePages(input: StorePageGenerationInput) {
    return scoreStorePageGeneration(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: StorePageGenerationInput,
  ): Promise<RenderableStorePage[]> {
    const breakdown = scoreStorePageGeneration(input);
    return this.repository.saveMany(workspaceId, breakdown.pages);
  }
}

export const defaultStorePageGenerationEngine = {
  generatePages: scoreStorePageGeneration,
};

export type { StorePageGenerationInput };
