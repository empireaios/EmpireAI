import { z } from "zod";

import { supplierCapabilitySchema, type SupplierCapability } from "./supplier-capability.js";
import { supplierRiskProfileSchema, type SupplierRiskProfile } from "./supplier-risk-profile.js";

export type SupplierProfileId = string;

/** Canonical supplier intelligence profile. */
export type SupplierProfile = {
  id: SupplierProfileId;
  workspaceId: string;
  supplierId: string;
  supplierName: string;
  country: string;
  categories: string[];
  fulfillmentScore: number;
  reliabilityScore: number;
  communicationScore: number;
  qualityScore: number;
  trustScore: number;
  capability: SupplierCapability;
  riskProfile: SupplierRiskProfile;
  createdAt: string;
  updatedAt: string;
};

export type SupplierProfileCreateInput = {
  supplierId: string;
  supplierName: string;
  country: string;
  categories: string[];
  fulfillmentScore: number;
  reliabilityScore: number;
  communicationScore: number;
  qualityScore: number;
  capability: SupplierCapability;
};

export type SupplierProfileUpdateInput = Partial<
  Omit<SupplierProfileCreateInput, "supplierId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const supplierProfileSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  country: z.string().min(1),
  categories: z.array(z.string()),
  fulfillmentScore: z.number().min(0).max(100),
  reliabilityScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  capability: supplierCapabilitySchema,
  riskProfile: supplierRiskProfileSchema,
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a SupplierProfile record shape. */
export function validateSupplierProfile(value: unknown): SupplierProfile {
  return supplierProfileSchema.parse(value);
}
