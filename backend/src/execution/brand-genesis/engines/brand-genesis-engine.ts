import type { BrandProfile } from "../models/brand-profile.js";
import type { BrandRepository } from "../repositories/brand-repository.js";
import {
  scoreBrandGenesis,
  type BrandGenesisInput,
} from "../scoring/brand-scoring.js";

/** Generates businesses from revenue opportunities. */
export class BrandGenesisEngine {
  constructor(private readonly repository: BrandRepository) {}

  generateBrand(input: BrandGenesisInput) {
    return scoreBrandGenesis(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: BrandGenesisInput,
  ): Promise<BrandProfile> {
    const breakdown = scoreBrandGenesis(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultBrandGenesisEngine = {
  generateBrand: scoreBrandGenesis,
};

export type { BrandGenesisInput };
