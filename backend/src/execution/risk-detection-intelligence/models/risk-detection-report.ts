import { z } from "zod";

import {
  campaignFailureDetectionSchema,
  type CampaignFailureDetection,
} from "./campaign-failure-detection.js";
import {
  chargebackRiskDetectionSchema,
  type ChargebackRiskDetection,
} from "./chargeback-risk-detection.js";
import {
  inventoryRiskDetectionSchema,
  type InventoryRiskDetection,
} from "./inventory-risk-detection.js";
import { riskAlertSchema, type RiskAlert } from "./risk-alert.js";
import {
  riskDetectionSignalSchema,
  type RiskDetectionSignal,
} from "./risk-detection-signal.js";
import {
  seoPenaltyDetectionSchema,
  type SeoPenaltyDetection,
} from "./seo-penalty-detection.js";
import {
  supplierFailureDetectionSchema,
  type SupplierFailureDetection,
} from "./supplier-failure-detection.js";
import {
  trafficDropDetectionSchema,
  type TrafficDropDetection,
} from "./traffic-drop-detection.js";

export type RiskDetectionReportId = string;

/** Complete risk detection report — intelligence only, no auto-intervention. */
export type RiskDetectionReport = {
  reportId: RiskDetectionReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  trafficDrop: TrafficDropDetection;
  supplierFailure: SupplierFailureDetection;
  campaignFailure: CampaignFailureDetection;
  chargebackRisk: ChargebackRiskDetection;
  inventoryRisk: InventoryRiskDetection;
  seoPenalty: SeoPenaltyDetection;
  alerts: RiskAlert[];
  totalAlerts: number;
  criticalAlerts: number;
  overallScore: number;
  confidence: number;
  signals: RiskDetectionSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoInterventionEnabled: false;
};

export type RiskDetectionReportCreateInput = Omit<RiskDetectionReport, "reportId">;

export const riskDetectionReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  trafficDrop: trafficDropDetectionSchema,
  supplierFailure: supplierFailureDetectionSchema,
  campaignFailure: campaignFailureDetectionSchema,
  chargebackRisk: chargebackRiskDetectionSchema,
  inventoryRisk: inventoryRiskDetectionSchema,
  seoPenalty: seoPenaltyDetectionSchema,
  alerts: z.array(riskAlertSchema),
  totalAlerts: z.number().int().min(0),
  criticalAlerts: z.number().int().min(0),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(riskDetectionSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoInterventionEnabled: z.literal(false),
});

/** Validates a RiskDetectionReport record shape. */
export function validateRiskDetectionReport(value: unknown): RiskDetectionReport {
  return riskDetectionReportSchema.parse(value);
}
