import { z } from "zod";

import { empireHealthScoreSchema, type EmpireHealthScore } from "./empire-health-score.js";
import {
  empireHealthSignalSchema,
  type EmpireHealthSignal,
} from "./empire-health-signal.js";
import { marginHealthSchema, type MarginHealth } from "./margin-health.js";
import { marketingHealthSchema, type MarketingHealth } from "./marketing-health.js";
import { ordersHealthSchema, type OrdersHealth } from "./orders-health.js";
import { refundsHealthSchema, type RefundsHealth } from "./refunds-health.js";
import { revenueHealthSchema, type RevenueHealth } from "./revenue-health.js";
import { supplierHealthSchema, type SupplierHealth } from "./supplier-health.js";
import { trafficHealthSchema, type TrafficHealth } from "./traffic-health.js";

export type EmpireHealthReportId = string;

/** Complete empire health monitoring report — intelligence only, no auto-intervention. */
export type EmpireHealthReport = {
  reportId: EmpireHealthReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  revenue: RevenueHealth;
  traffic: TrafficHealth;
  margins: MarginHealth;
  orders: OrdersHealth;
  refunds: RefundsHealth;
  supplier: SupplierHealth;
  marketing: MarketingHealth;
  empireHealthScore: EmpireHealthScore;
  confidence: number;
  signals: EmpireHealthSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoInterventionEnabled: false;
};

export type EmpireHealthReportCreateInput = Omit<EmpireHealthReport, "reportId">;

export const empireHealthReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  revenue: revenueHealthSchema,
  traffic: trafficHealthSchema,
  margins: marginHealthSchema,
  orders: ordersHealthSchema,
  refunds: refundsHealthSchema,
  supplier: supplierHealthSchema,
  marketing: marketingHealthSchema,
  empireHealthScore: empireHealthScoreSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(empireHealthSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoInterventionEnabled: z.literal(false),
});

/** Validates an EmpireHealthReport record shape. */
export function validateEmpireHealthReport(value: unknown): EmpireHealthReport {
  return empireHealthReportSchema.parse(value);
}
