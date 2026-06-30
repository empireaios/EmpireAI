import { z } from "zod";

export const EYE_IDS = [
  "product_eye",
  "marketplace_eye",
  "supplier_eye",
  "competitor_eye",
  "customer_eye",
  "seo_eye",
  "marketing_eye",
  "financial_eye",
  "risk_eye",
  "executive_eye",
] as const;

export type EyeId = (typeof EYE_IDS)[number];

export const empireObservationSchema = z.object({
  observationId: z.string().min(1),
  eyeId: z.enum(EYE_IDS),
  workspaceId: z.string().min(1),
  companyId: z.string().optional(),
  observation: z.string().min(1),
  source: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  confidence: z.number().int().min(0).max(100),
  evidence: z.array(z.string()),
  relatedProducts: z.array(z.string()),
  relatedBusinesses: z.array(z.string()),
  relatedBrands: z.array(z.string()),
  relatedSuppliers: z.array(z.string()),
  relatedMarketplaces: z.array(z.string()),
  relatedCustomers: z.array(z.string()),
  relatedRisks: z.array(z.string()),
  relatedOpportunities: z.array(z.string()),
  linkedObservationIds: z.array(z.string()),
  dedupHash: z.string().min(1),
  observationOnly: z.literal(true),
});

export const eyeIntelligenceReportSchema = z.object({
  reportId: z.string().min(1),
  eyeId: z.enum(EYE_IDS),
  workspaceId: z.string().min(1),
  companyId: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  findings: z.array(z.string()),
  alerts: z.array(z.object({
    alertId: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    message: z.string(),
  })),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  observationIds: z.array(z.string()),
  confidence: z.number().int().min(0).max(100),
  observationOnly: z.literal(true),
  createdAt: z.string().datetime({ offset: true }),
});

export const investigationRecordSchema = z.object({
  investigationId: z.string().min(1),
  workspaceId: z.string().min(1),
  eyeId: z.enum(EYE_IDS),
  question: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]),
  newQuestions: z.array(z.string()),
  newInvestigations: z.array(z.string()),
  correlations: z.array(z.string()),
  contradictions: z.array(z.string()),
  confidenceAdjustments: z.array(z.object({
    observationId: z.string(),
    previousConfidence: z.number(),
    newConfidence: z.number(),
    reason: z.string(),
  })),
  observationIds: z.array(z.string()),
  completedAt: z.string().datetime({ offset: true }).optional(),
  createdAt: z.string().datetime({ offset: true }),
});

export const executiveBriefSchema = z.object({
  briefId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().optional(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  urgentAlerts: z.array(z.string()),
  capitalRecommendations: z.array(z.string()),
  growthRecommendations: z.array(z.string()),
  recommendedInvestigations: z.array(z.string()),
  recommendedBusinessOpportunities: z.array(z.string()),
  topOpportunities: z.array(z.string()),
  topRisks: z.array(z.string()),
  eyeSummaries: z.record(z.string()),
  observationOnly: z.literal(true),
  createdAt: z.string().datetime({ offset: true }),
});

export const eyeSeriesDashboardSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  todaysIntelligence: z.string(),
  urgentAlerts: z.array(z.string()),
  topOpportunities: z.array(z.string()),
  topRisks: z.array(z.string()),
  productsWorthInvestigating: z.array(z.string()),
  supplierChanges: z.array(z.string()),
  marketplaceChanges: z.array(z.string()),
  competitorChanges: z.array(z.string()),
  customerSignals: z.array(z.string()),
  financialSignals: z.array(z.string()),
  executiveRecommendations: z.array(z.string()),
  totalObservations: z.number().int().min(0),
  computedAt: z.string().datetime({ offset: true }),
});

export const eyeSeriesValidationSchema = z.object({
  validationId: z.string().min(1),
  workspaceId: z.string().min(1),
  valid: z.boolean(),
  eyesValidated: z.number().int().min(0),
  knowledgeGraphValid: z.boolean(),
  investigationEngineValid: z.boolean(),
  dashboardValid: z.boolean(),
  observationOnlyEnforced: z.literal(true),
  blockers: z.array(z.string()),
  validatedAt: z.string().datetime({ offset: true }),
});

export type EmpireObservation = z.infer<typeof empireObservationSchema>;
export type EyeIntelligenceReport = z.infer<typeof eyeIntelligenceReportSchema>;
export type InvestigationRecord = z.infer<typeof investigationRecordSchema>;
export type ExecutiveBrief = z.infer<typeof executiveBriefSchema>;
export type EyeSeriesDashboard = z.infer<typeof eyeSeriesDashboardSchema>;
export type EyeSeriesValidation = z.infer<typeof eyeSeriesValidationSchema>;
