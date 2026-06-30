import { z } from "zod";

/** REAL-015 — Supplier intelligence continuous loop signals. */
export const SUPPLIER_LOOP_SIGNALS = [
  "BETTER_SUPPLIER",
  "CHEAPER_SUPPLIER",
  "FASTER_SUPPLIER",
  "HIGHER_MARGIN_SUPPLIER",
  "COUNTRY_LIMITATION",
  "RISK_INCREASE",
  "INVENTORY_LOW",
  "MARGIN_CHANGE",
] as const;

export const supplierLoopSignalSchema = z.object({
  signalId: z.string(),
  supplierProductId: z.string(),
  signalType: z.enum(SUPPLIER_LOOP_SIGNALS),
  recommendation: z.string(),
  confidence: z.number().min(0).max(100),
  executiveOnly: z.literal(true),
});

export const supplierIntelligenceLoopSchema = z.object({
  moduleId: z.literal("supplier-intelligence-loop"),
  missionId: z.literal("REAL-015"),
  workspaceId: z.string(),
  companyId: z.string(),
  inventoryAlerts: z.number().int(),
  supplierHealthScore: z.number().min(0).max(100),
  signals: z.array(supplierLoopSignalSchema),
  computedAt: z.string().datetime({ offset: true }),
});

export type SupplierIntelligenceLoop = z.infer<typeof supplierIntelligenceLoopSchema>;
