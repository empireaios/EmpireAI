import { z } from "zod";

export type ProductRelationshipId = string;

export type ProductRelationshipType = "related" | "substitute" | "complementary";

export const PRODUCT_RELATIONSHIP_TYPES: readonly ProductRelationshipType[] = [
  "related",
  "substitute",
  "complementary",
] as const;

/** Directed relationship between two canonical product entities. */
export type ProductRelationship = {
  id: ProductRelationshipId;
  workspaceId: string;
  sourceProductId: string;
  targetProductId: string;
  relationshipType: ProductRelationshipType;
  strength: number;
  notes?: string;
  createdAt: string;
};

export type ProductRelationshipCreateInput = Omit<
  ProductRelationship,
  "id" | "workspaceId" | "createdAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const productRelationshipSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  sourceProductId: z.string().min(1),
  targetProductId: z.string().min(1),
  relationshipType: z.enum(["related", "substitute", "complementary"]),
  strength: z.number().min(0).max(100),
  notes: z.string().optional(),
  createdAt: isoTimestamp,
});

/** Validates a ProductRelationship record shape. */
export function validateProductRelationship(value: unknown): ProductRelationship {
  return productRelationshipSchema.parse(value);
}
