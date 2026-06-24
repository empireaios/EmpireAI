import { z } from "zod";

/** Supplier fulfillment capability flags. */
export type SupplierCapability = {
  supportsDropshipping: boolean;
  supportsBranding: boolean;
  supportsCustomPackaging: boolean;
  supportsBulkOrders: boolean;
};

export type SupplierCapabilityInput = SupplierCapability;

export const supplierCapabilitySchema = z.object({
  supportsDropshipping: z.boolean(),
  supportsBranding: z.boolean(),
  supportsCustomPackaging: z.boolean(),
  supportsBulkOrders: z.boolean(),
});

/** Validates a SupplierCapability record shape. */
export function validateSupplierCapability(value: unknown): SupplierCapability {
  return supplierCapabilitySchema.parse(value);
}

/** Evaluates whether capabilities meet minimum sourcing requirements. */
export function evaluateSupplierCapability(capability: SupplierCapability): {
  score: number;
  strengths: string[];
  gaps: string[];
} {
  const flags = [
    { key: "supportsDropshipping", label: "dropshipping" },
    { key: "supportsBranding", label: "branding" },
    { key: "supportsCustomPackaging", label: "custom packaging" },
    { key: "supportsBulkOrders", label: "bulk orders" },
  ] as const;

  const strengths: string[] = [];
  const gaps: string[] = [];

  for (const flag of flags) {
    if (capability[flag.key]) {
      strengths.push(`Supports ${flag.label}`);
    } else {
      gaps.push(`Missing ${flag.label}`);
    }
  }

  const score = Math.round((strengths.length / flags.length) * 100);
  return { score, strengths, gaps };
}
