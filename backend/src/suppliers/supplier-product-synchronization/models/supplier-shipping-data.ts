import { z } from "zod";

/** A shipping option offered by a supplier for a product. */
export type SupplierShippingMethod = {
  method: string;
  cost: number;
  minDays: number;
  maxDays: number;
  regions: string[];
};

/** Shipping data synced for a supplier product. */
export type SupplierShippingData = {
  supplierSku: string;
  defaultMethod: string;
  methods: SupplierShippingMethod[];
};

export const supplierShippingMethodSchema = z.object({
  method: z.string().min(1),
  cost: z.number().min(0),
  minDays: z.number().int().min(0),
  maxDays: z.number().int().min(0),
  regions: z.array(z.string()).min(1),
});

export const supplierShippingDataSchema = z.object({
  supplierSku: z.string().min(1),
  defaultMethod: z.string().min(1),
  methods: z.array(supplierShippingMethodSchema).min(1),
});

/** Validates SupplierShippingData record shape. */
export function validateSupplierShippingData(value: unknown): SupplierShippingData {
  return supplierShippingDataSchema.parse(value);
}
