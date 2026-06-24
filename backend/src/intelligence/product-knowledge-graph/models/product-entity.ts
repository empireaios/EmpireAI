import { z } from "zod";

/** Canonical product identity identifier. */
export type ProductEntityId = string;

export type ProductSupplierRef = {
  supplierId: string;
  supplierSku?: string;
  supplierName?: string;
  isPrimary?: boolean;
};

/** Canonical product node in the knowledge graph. */
export type ProductEntity = {
  id: ProductEntityId;
  workspaceId: string;
  canonicalSlug: string;
  displayName: string;
  description?: string;
  categoryId?: string;
  targetBuyerPersonaIds: string[];
  supplierRefs: ProductSupplierRef[];
  sourceObservationIds: string[];
  confidence: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProductEntityCreateInput = Omit<
  ProductEntity,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type ProductEntityUpdateInput = Partial<ProductEntityCreateInput>;

const isoTimestamp = z.string().datetime({ offset: true });

const supplierRefSchema = z.object({
  supplierId: z.string().min(1),
  supplierSku: z.string().optional(),
  supplierName: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const productEntitySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  canonicalSlug: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  targetBuyerPersonaIds: z.array(z.string()),
  supplierRefs: z.array(supplierRefSchema),
  sourceObservationIds: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  tags: z.array(z.string()),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ProductEntity record shape. */
export function validateProductEntity(value: unknown): ProductEntity {
  return productEntitySchema.parse(value);
}
