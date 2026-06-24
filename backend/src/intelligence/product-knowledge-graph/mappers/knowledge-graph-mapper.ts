import {
  aliasTokensToSlug,
  normalizeProductAlias,
  tokenizeProductAlias,
} from "../models/product-alias.js";
import type { ProductEntityCreateInput } from "../models/product-entity.js";

export type CanonicalProductResolution = {
  canonicalSlug: string;
  normalizedAliases: string[];
  displayName: string;
};

export type RegisterProductAliasesInput = {
  displayName: string;
  aliases: string[];
  description?: string;
  categoryId?: string;
  targetBuyerPersonaIds?: string[];
  supplierRefs?: ProductEntityCreateInput["supplierRefs"];
  sourceObservationIds?: string[];
  confidence?: number;
  tags?: string[];
};

/** Maps surface product text to canonical knowledge graph identities. */
export class KnowledgeGraphMapper {
  /** Normalizes alias text for lookup comparisons. */
  normalizeAlias(text: string): string {
    return normalizeProductAlias(text);
  }

  /** Converts a single alias to a slug when used in isolation. */
  aliasToSlug(text: string): string {
    return aliasTokensToSlug(tokenizeProductAlias(text));
  }

  /**
   * Generates a canonical slug from multiple aliases.
   * Example: "Portable USB Blender", "USB smoothie blender" -> portable-usb-blender
   */
  generateCanonicalSlug(aliases: string[], primaryDisplayName?: string): string {
    const cleaned = aliases.map((alias) => alias.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      return this.aliasToSlug(primaryDisplayName ?? "product");
    }

    const primary = (primaryDisplayName?.trim() || cleaned[0]) ?? "product";
    const tokenSets = cleaned.map((alias) => new Set(tokenizeProductAlias(alias)));
    const primaryTokens = tokenizeProductAlias(primary);
    const threshold = Math.max(1, Math.ceil(cleaned.length / 2));
    const counts = new Map<string, number>();

    for (const tokenSet of tokenSets) {
      for (const token of tokenSet) {
        counts.set(token, (counts.get(token) ?? 0) + 1);
      }
    }

    const selected = primaryTokens.filter((token) => (counts.get(token) ?? 0) >= threshold);
    if (selected.length > 0) {
      return aliasTokensToSlug(selected);
    }

    const fallbackTokens = [...counts.entries()]
      .filter(([, count]) => count >= threshold)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([token]) => token);

    if (fallbackTokens.length > 0) {
      return aliasTokensToSlug(fallbackTokens);
    }

    return this.aliasToSlug(primary);
  }

  /** Resolves aliases to a canonical slug and normalized alias list. */
  resolveCanonicalIdentity(
    aliases: string[],
    primaryDisplayName?: string,
  ): CanonicalProductResolution {
    const displayName = primaryDisplayName?.trim() || aliases[0]?.trim() || "Unnamed Product";
    const normalizedAliases = [...new Set(aliases.map((alias) => this.normalizeAlias(alias)))].filter(
      Boolean,
    );
    const canonicalSlug = this.generateCanonicalSlug(aliases, displayName);

    return {
      canonicalSlug,
      normalizedAliases,
      displayName,
    };
  }

  /** Builds a ProductEntity create payload from aliases and optional references. */
  mapAliasesToEntityInput(input: RegisterProductAliasesInput): ProductEntityCreateInput {
    const resolution = this.resolveCanonicalIdentity(input.aliases, input.displayName);

    return {
      canonicalSlug: resolution.canonicalSlug,
      displayName: resolution.displayName,
      description: input.description,
      categoryId: input.categoryId,
      targetBuyerPersonaIds: input.targetBuyerPersonaIds ?? [],
      supplierRefs: input.supplierRefs ?? [],
      sourceObservationIds: input.sourceObservationIds ?? [],
      confidence: input.confidence ?? 70,
      tags: input.tags ?? [],
    };
  }
}

export const defaultKnowledgeGraphMapper = new KnowledgeGraphMapper();
