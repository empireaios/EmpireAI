import { z } from "zod";

import {
  SUPPLIER_HEALTH_STATES,
  type SupplierHealthState,
} from "../../../suppliers/supplier-connector-framework/models/supplier-health.js";
import {
  SUPPLIER_PLATFORMS,
  type SupplierPlatform,
} from "../../../suppliers/supplier-connector-framework/models/supplier-platform.js";

/** Supplier row displayed on the founder command center dashboard. */
export type DashboardSupplierItem = {
  connectorId: string;
  platform: SupplierPlatform;
  healthState: SupplierHealthState;
  credentialsConfigured: boolean;
  confidence: number;
};

/** Aggregated suppliers section for the founder dashboard. */
export type DashboardSupplierSection = {
  totalCount: number;
  readyCount: number;
  healthScore: number;
  summary: string;
  items: DashboardSupplierItem[];
};

export const dashboardSupplierItemSchema = z.object({
  connectorId: z.string().min(1),
  platform: z.enum(SUPPLIER_PLATFORMS),
  healthState: z.enum(SUPPLIER_HEALTH_STATES),
  credentialsConfigured: z.boolean(),
  confidence: z.number().min(0).max(100),
});

export const dashboardSupplierSectionSchema = z.object({
  totalCount: z.number().int().min(0),
  readyCount: z.number().int().min(0),
  healthScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  items: z.array(dashboardSupplierItemSchema),
});

/** Validates a DashboardSupplierSection record shape. */
export function validateDashboardSupplierSection(value: unknown): DashboardSupplierSection {
  return dashboardSupplierSectionSchema.parse(value);
}
