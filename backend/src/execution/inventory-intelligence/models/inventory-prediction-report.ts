import { z } from "zod";

import { demandForecastSchema, type DemandForecast } from "./demand-forecast.js";
import { inventorySignalSchema, type InventorySignal } from "./inventory-signal.js";
import { leadTimeEstimateSchema, type LeadTimeEstimate } from "./lead-time-estimate.js";
import { restockAlertSchema, type RestockAlert } from "./restock-alert.js";
import { safetyStockSchema, type SafetyStock } from "./safety-stock.js";
import { seasonalityProfileSchema, type SeasonalityProfile } from "./seasonality-profile.js";
import { supplierStockSchema, type SupplierStock } from "./supplier-stock.js";

export type InventoryPredictionReportId = string;

/** Complete inventory prediction report — intelligence only, no auto-order. */
export type InventoryPredictionReport = {
  reportId: InventoryPredictionReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  demandForecast: DemandForecast;
  seasonality: SeasonalityProfile;
  supplierStock: SupplierStock[];
  leadTime: LeadTimeEstimate;
  safetyStock: SafetyStock;
  restockAlerts: RestockAlert[];
  predictedStockoutDate: string | null;
  overallScore: number;
  confidence: number;
  signals: InventorySignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoOrderEnabled: false;
};

export type InventoryPredictionReportCreateInput = Omit<InventoryPredictionReport, "reportId">;

export const inventoryPredictionReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  demandForecast: demandForecastSchema,
  seasonality: seasonalityProfileSchema,
  supplierStock: z.array(supplierStockSchema).min(1),
  leadTime: leadTimeEstimateSchema,
  safetyStock: safetyStockSchema,
  restockAlerts: z.array(restockAlertSchema),
  predictedStockoutDate: z.string().datetime({ offset: true }).nullable(),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(inventorySignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoOrderEnabled: z.literal(false),
});

/** Validates an InventoryPredictionReport record shape. */
export function validateInventoryPredictionReport(value: unknown): InventoryPredictionReport {
  return inventoryPredictionReportSchema.parse(value);
}
