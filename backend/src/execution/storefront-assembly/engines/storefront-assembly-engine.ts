import type { Storefront } from "../models/storefront.js";
import type { StorefrontRepository } from "../repositories/storefront-repository.js";
import {
  scoreStorefrontAssembly,
  type StorefrontAssemblyInput,
} from "../scoring/storefront-assembly-scoring.js";

/** Converts renderable store pages into a deployable storefront structure. */
export class StorefrontAssemblyEngine {
  constructor(private readonly repository: StorefrontRepository) {}

  assembleStorefront(input: StorefrontAssemblyInput) {
    return scoreStorefrontAssembly(input);
  }

  async assembleAndSave(
    workspaceId: string,
    input: StorefrontAssemblyInput,
  ): Promise<Storefront> {
    const breakdown = scoreStorefrontAssembly(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultStorefrontAssemblyEngine = {
  assembleStorefront: scoreStorefrontAssembly,
};

export type { StorefrontAssemblyInput };
