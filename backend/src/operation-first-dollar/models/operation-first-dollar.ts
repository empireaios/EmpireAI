import { z } from "zod";

export const METRIC_SOURCES = ["REAL", "SIMULATED"] as const;
export type MetricSource = (typeof METRIC_SOURCES)[number];

export const OFD_PHASES = [
  "PRE_LAUNCH",
  "LAUNCH_PREP",
  "LIVE_TRADING",
  "FIRST_DOLLAR",
  "PROFITABLE",
  "SCALING",
] as const;

export type OfDPhase = (typeof OFD_PHASES)[number];

export const FIRST_DOLLAR_MILESTONES = [
  "FIRST_PRODUCT_SELECTED",
  "FIRST_SUPPLIER_CONNECTED",
  "FIRST_MARKETPLACE_CONNECTED",
  "FIRST_LISTING_CREATED",
  "FIRST_VISITOR",
  "FIRST_ADD_TO_CART",
  "FIRST_SALE",
  "FIRST_SHIPMENT",
  "FIRST_PAYOUT",
  "FIRST_PROFIT",
] as const;

export type FirstDollarMilestone = (typeof FIRST_DOLLAR_MILESTONES)[number];

export const MILESTONE_ORDER: FirstDollarMilestone[] = [...FIRST_DOLLAR_MILESTONES];

/** Milestones that require REAL source — cannot be simulated. */
export const REAL_ONLY_MILESTONES: FirstDollarMilestone[] = [
  "FIRST_VISITOR",
  "FIRST_ADD_TO_CART",
  "FIRST_SALE",
  "FIRST_SHIPMENT",
  "FIRST_PAYOUT",
  "FIRST_PROFIT",
];

export const metricValueSchema = z.object({
  value: z.number(),
  source: z.enum(METRIC_SOURCES),
  currency: z.string().default("USD"),
  recordedAt: z.string().datetime({ offset: true }),
  externalReference: z.string().optional(),
});

export const launchCommandCenterSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  launchReadiness: z.number().int().min(0).max(100),
  dailyPriorities: z.array(z.string()),
  blockingIssues: z.array(z.string()),
  executiveRecommendations: z.array(z.string()),
  revenueObjectiveUsd: z.number().min(0),
  revenueObjectiveLabel: z.string().default("USD 100,000"),
  currentPhase: z.enum(OFD_PHASES),
  computedAt: z.string().datetime({ offset: true }),
});

export const milestoneRecordSchema = z.object({
  milestoneId: z.string().min(1),
  milestone: z.enum(FIRST_DOLLAR_MILESTONES),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  achieved: z.boolean(),
  source: z.enum(METRIC_SOURCES),
  evidence: z.string().optional(),
  externalReference: z.string().optional(),
  permanentHistory: z.literal(true),
  achievedAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

export const businessKpiSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  revenue: metricValueSchema,
  profit: metricValueSchema,
  margin: metricValueSchema,
  conversion: metricValueSchema,
  orders: metricValueSchema,
  refunds: metricValueSchema,
  customerSatisfaction: metricValueSchema,
  growth: metricValueSchema,
  cashflow: metricValueSchema,
  computedAt: z.string().datetime({ offset: true }),
});

export const empireLearningRecordSchema = z.object({
  learningId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  decision: z.string().min(1),
  result: z.string().min(1),
  whySucceeded: z.string().optional(),
  whyFailed: z.string().optional(),
  recommendedImprovements: z.array(z.string()),
  source: z.enum(METRIC_SOURCES),
  eventType: z.string().min(1),
  permanentHistory: z.literal(true),
  createdAt: z.string().datetime({ offset: true }),
});

export const dailyExecutiveBriefSchema = z.object({
  briefId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  whatHappenedYesterday: z.string().min(1),
  whatChangedOvernight: z.string().min(1),
  todaysHighestPriority: z.string().min(1),
  grandKingActionsToday: z.array(z.string()),
  blockingRevenue: z.array(z.string()),
  biggestOpportunity: z.string().min(1),
  source: z.enum(METRIC_SOURCES).default("REAL"),
  createdAt: z.string().datetime({ offset: true }),
});

export const operationFirstDollarDashboardSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  status: z.string().min(1),
  currentPhase: z.enum(OFD_PHASES),
  revenueToday: z.object({ value: z.number(), source: z.enum(METRIC_SOURCES) }),
  profitToday: z.object({ value: z.number(), source: z.enum(METRIC_SOURCES) }),
  daysSinceLaunch: z.number().int().min(0),
  nextCriticalAction: z.string().min(1),
  empireLearningCount: z.number().int().min(0),
  milestonesAchieved: z.number().int().min(0),
  milestonesTotal: z.number().int().min(0),
  computedAt: z.string().datetime({ offset: true }),
});

export type LaunchCommandCenter = z.infer<typeof launchCommandCenterSchema>;
export type MilestoneRecord = z.infer<typeof milestoneRecordSchema>;
export type BusinessKpiSnapshot = z.infer<typeof businessKpiSnapshotSchema>;
export type EmpireLearningRecord = z.infer<typeof empireLearningRecordSchema>;
export type DailyExecutiveBrief = z.infer<typeof dailyExecutiveBriefSchema>;
export type OperationFirstDollarDashboard = z.infer<typeof operationFirstDollarDashboardSchema>;
export type MetricValue = z.infer<typeof metricValueSchema>;
