import { z } from "zod";

/** Alias record linking surface text to a canonical product entity. */
export type ProductAliasId = string;

export type ProductAlias = {
  id: ProductAliasId;
  workspaceId: string;
  productEntityId: string;
  aliasText: string;
  normalizedAlias: string;
  source?: string;
  createdAt: string;
};

export type ProductAliasCreateInput = Omit<
  ProductAlias,
  "id" | "workspaceId" | "normalizedAlias" | "createdAt"
> & {
  normalizedAlias?: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const productAliasSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  productEntityId: z.string().min(1),
  aliasText: z.string().min(1),
  normalizedAlias: z.string().min(1),
  source: z.string().optional(),
  createdAt: isoTimestamp,
});

/** Validates a ProductAlias record shape. */
export function validateProductAlias(value: unknown): ProductAlias {
  return productAliasSchema.parse(value);
}

/** Normalizes alias text for lookup and canonical slug tokenization. */
export function normalizeProductAlias(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenizes normalized alias text into slug parts. */
export function tokenizeProductAlias(text: string): string[] {
  const normalized = normalizeProductAlias(text);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

/** Converts normalized alias tokens to a slug segment string. */
export function aliasTokensToSlug(tokens: string[]): string {
  return tokens.join("-");
}
