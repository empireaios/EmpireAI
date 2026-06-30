import { z } from "zod";

import { companyEntrySchema, type CompanyEntry } from "./company-entry.js";
import {
  crossBrandIntelligenceSchema,
  type CrossBrandIntelligence,
} from "./cross-brand-intelligence.js";
import {
  crossLearningInsightSchema,
  type CrossLearningInsight,
} from "./cross-learning-insight.js";
import {
  multiCompanySignalSchema,
  type MultiCompanySignal,
} from "./multi-company-signal.js";
import {
  portfolioManagementSchema,
  type PortfolioManagement,
} from "./portfolio-management.js";

export type MultiCompanyReportId = string;

/** Complete multi-company intelligence report — intelligence only, no auto-merge. */
export type MultiCompanyReport = {
  reportId: MultiCompanyReportId;
  empireId: string;
  reportName: string;
  companies: CompanyEntry[];
  crossLearning: CrossLearningInsight[];
  crossBrand: CrossBrandIntelligence;
  portfolio: PortfolioManagement;
  unlimitedCompaniesSupported: true;
  overallScore: number;
  confidence: number;
  signals: MultiCompanySignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoMergeEnabled: false;
};

export type MultiCompanyReportCreateInput = Omit<MultiCompanyReport, "reportId">;

export const multiCompanyReportSchema = z.object({
  reportId: z.string().min(1),
  empireId: z.string().min(1),
  reportName: z.string().min(1),
  companies: z.array(companyEntrySchema).min(1),
  crossLearning: z.array(crossLearningInsightSchema).min(1),
  crossBrand: crossBrandIntelligenceSchema,
  portfolio: portfolioManagementSchema,
  unlimitedCompaniesSupported: z.literal(true),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(multiCompanySignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoMergeEnabled: z.literal(false),
});

/** Validates a MultiCompanyReport record shape. */
export function validateMultiCompanyReport(value: unknown): MultiCompanyReport {
  return multiCompanyReportSchema.parse(value);
}
