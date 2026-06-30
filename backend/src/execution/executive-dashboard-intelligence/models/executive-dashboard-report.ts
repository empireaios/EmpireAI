import { z } from "zod";

import { alertsWidgetSchema, type AlertsWidget } from "./alerts-widget.js";
import {
  executiveDashboardSignalSchema,
  type ExecutiveDashboardSignal,
} from "./executive-dashboard-signal.js";
import { eyeWidgetSchema, type EyeWidget } from "./eye-widget.js";
import { inventoryWidgetSchema, type InventoryWidget } from "./inventory-widget.js";
import { manufacturingWidgetSchema, type ManufacturingWidget } from "./manufacturing-widget.js";
import { marketingWidgetSchema, type MarketingWidget } from "./marketing-widget.js";
import { ordersWidgetSchema, type OrdersWidget } from "./orders-widget.js";
import { profitWidgetSchema, type ProfitWidget } from "./profit-widget.js";
import { revenueWidgetSchema, type RevenueWidget } from "./revenue-widget.js";
import { roasWidgetSchema, type RoasWidget } from "./roas-widget.js";
import { visitorsWidgetSchema, type VisitorsWidget } from "./visitors-widget.js";

export type ExecutiveDashboardReportId = string;

/** Complete executive dashboard report — intelligence only, no deployment. */
export type ExecutiveDashboardReport = {
  reportId: ExecutiveDashboardReportId;
  storeId: string;
  brandId: string;
  dashboardName: string;
  revenue: RevenueWidget;
  orders: OrdersWidget;
  visitors: VisitorsWidget;
  roas: RoasWidget;
  profit: ProfitWidget;
  inventory: InventoryWidget;
  marketing: MarketingWidget;
  manufacturing: ManufacturingWidget;
  eye: EyeWidget;
  alerts: AlertsWidget;
  overallScore: number;
  confidence: number;
  signals: ExecutiveDashboardSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoRefreshEnabled: false;
};

export type ExecutiveDashboardReportCreateInput = Omit<ExecutiveDashboardReport, "reportId">;

export const executiveDashboardReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  dashboardName: z.string().min(1),
  revenue: revenueWidgetSchema,
  orders: ordersWidgetSchema,
  visitors: visitorsWidgetSchema,
  roas: roasWidgetSchema,
  profit: profitWidgetSchema,
  inventory: inventoryWidgetSchema,
  marketing: marketingWidgetSchema,
  manufacturing: manufacturingWidgetSchema,
  eye: eyeWidgetSchema,
  alerts: alertsWidgetSchema,
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(executiveDashboardSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoRefreshEnabled: z.literal(false),
});

/** Validates an ExecutiveDashboardReport record shape. */
export function validateExecutiveDashboardReport(value: unknown): ExecutiveDashboardReport {
  return executiveDashboardReportSchema.parse(value);
}
