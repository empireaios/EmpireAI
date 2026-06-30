import { randomUUID } from "node:crypto";

import { captureSoulRuntimeEvent } from "../../foundation/soul-runtime/services/soul-runtime-engine.js";
import { getBusinessBuildRepository } from "../../orchestration/business-build-engine/index.js";
import { getBusinessOpportunityRepository } from "../../orchestration/business-opportunity-workspace/index.js";
import { getBusinessSimulationRepository } from "../../orchestration/business-simulation-engine/index.js";
import { buildCommerceOperationsDashboard } from "../../orchestration/execution-layer/index.js";
import { buildRealityIntegrationDashboard } from "../../orchestration/reality-integration/index.js";
import { listConnectorRuntimeStates } from "../../orchestration/reality-integration/index.js";
import type {
  BusinessKpiSnapshot,
  DailyExecutiveBrief,
  EmpireLearningRecord,
  FirstDollarMilestone,
  LaunchCommandCenter,
  MetricSource,
  MetricValue,
  MilestoneRecord,
  OfDPhase,
  OperationFirstDollarDashboard,
} from "../models/operation-first-dollar.js";
import {
  FIRST_DOLLAR_MILESTONES,
  MILESTONE_ORDER,
  REAL_ONLY_MILESTONES,
} from "../models/operation-first-dollar.js";
import {
  getOperationFirstDollarRepository,
  resetOperationFirstDollarRepository,
} from "../repositories/sqlite-operation-first-dollar-repository.js";

export { resetOperationFirstDollarRepository };

export class OperationFirstDollarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationFirstDollarError";
  }
}

function now(): string {
  return new Date().toISOString();
}

function simulatedMetric(value: number): MetricValue {
  return { value, source: "SIMULATED", currency: "USD", recordedAt: now() };
}

function realMetric(value: number, externalReference?: string): MetricValue {
  return { value, source: "REAL", currency: "USD", recordedAt: now(), externalReference };
}

function zeroRealMetric(): MetricValue {
  return realMetric(0);
}

function captureOfdSoulRuntime(workspaceId: string, title: string, summary: string, payload: Record<string, unknown>) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor: "operation-first-dollar",
      payload,
    });
  } catch {
    // best-effort
  }
}

export function resolveCurrentPhase(workspaceId: string, companyId: string): OfDPhase {
  const repo = getOperationFirstDollarRepository();
  const milestones = repo.listMilestones(workspaceId, companyId);
  const achieved = new Set(milestones.filter((m) => m.achieved).map((m) => m.milestone));

  if (achieved.has("FIRST_PROFIT")) return "PROFITABLE";
  if (achieved.has("FIRST_SALE")) return "FIRST_DOLLAR";
  if (achieved.has("FIRST_LISTING_CREATED")) return "LIVE_TRADING";
  if (achieved.has("FIRST_PRODUCT_SELECTED")) return "LAUNCH_PREP";
  return "PRE_LAUNCH";
}

export function buildLaunchCommandCenter(workspaceId: string, companyId: string): LaunchCommandCenter {
  const commerce = buildCommerceOperationsDashboard(workspaceId, companyId);
  const reality = buildRealityIntegrationDashboard(workspaceId, companyId);
  const opportunities = getBusinessOpportunityRepository().listOpportunities(workspaceId, companyId);
  const builds = getBusinessBuildRepository().listBuilds(workspaceId, companyId);
  const connected = listConnectorRuntimeStates(workspaceId).filter((s) => s.lifecycle === "CONNECTED");

  const blockingIssues: string[] = [];
  if (connected.length === 0) blockingIssues.push("No live connectors — connect Stripe and CJ Dropshipping");
  if (builds.filter((b) => b.status === "READY_FOR_PUBLICATION").length === 0) {
    blockingIssues.push("No publication-ready build package");
  }
  if (reality.connectedServices.length < 2) {
    blockingIssues.push("Insufficient connected services for live launch");
  }
  blockingIssues.push(...commerce.warnings);

  const dailyPriorities: string[] = [];
  if (blockingIssues.length > 0) {
    dailyPriorities.push(`Resolve blocker: ${blockingIssues[0]}`);
  }
  dailyPriorities.push(commerce.recommendedNextAction);
  if (opportunities.length > 0) {
    dailyPriorities.push(`Advance top opportunity: ${opportunities[0]!.brand.businessName}`);
  }

  const launchReadiness = Math.min(
    100,
    Math.round(
      (commerce.overallHealth * 0.3) +
      (reality.connectedServices.length / 5 * 30) +
      (builds.filter((b) => b.status === "READY_FOR_PUBLICATION").length > 0 ? 25 : 0) +
      (opportunities.filter((o) => o.status === "APPROVED").length > 0 ? 15 : 0),
    ),
  );

  return {
    workspaceId,
    companyId,
    launchReadiness,
    dailyPriorities: dailyPriorities.slice(0, 5),
    blockingIssues,
    executiveRecommendations: [
      "Connect payment and supplier before first listing",
      "Record REAL milestones only when verified externally",
      "Target USD 100,000 revenue — every decision evaluated against this goal",
      ...commerce.errors.length === 0 ? [] : [`Fix: ${commerce.errors[0]}`],
    ],
    revenueObjectiveUsd: 100_000,
    revenueObjectiveLabel: "USD 100,000",
    currentPhase: resolveCurrentPhase(workspaceId, companyId),
    computedAt: now(),
  };
}

export function recordMilestone(input: {
  workspaceId: string;
  companyId: string;
  milestone: FirstDollarMilestone;
  source: MetricSource;
  evidence?: string;
  externalReference?: string;
  actor?: string;
}): MilestoneRecord {
  if (REAL_ONLY_MILESTONES.includes(input.milestone) && input.source !== "REAL") {
    throw new OperationFirstDollarError(
      `Milestone ${input.milestone} requires REAL source — simulated milestones blocked`,
    );
  }
  if (input.source === "REAL" && REAL_ONLY_MILESTONES.includes(input.milestone) && !input.externalReference) {
    throw new OperationFirstDollarError(
      `REAL milestone ${input.milestone} requires externalReference for verification`,
    );
  }

  const record: MilestoneRecord = {
    milestoneId: `ms-${randomUUID()}`,
    milestone: input.milestone,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    achieved: true,
    source: input.source,
    evidence: input.evidence,
    externalReference: input.externalReference,
    permanentHistory: true,
    achievedAt: now(),
    createdAt: now(),
  };

  getOperationFirstDollarRepository().saveMilestone(record);
  captureOfdSoulRuntime(
    input.workspaceId,
    `First Dollar milestone: ${input.milestone}`,
    `Source: ${input.source}`,
    { milestone: input.milestone, source: input.source },
  );

  if (input.source === "REAL") {
    recordEmpireLearning({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      decision: `Achieved milestone ${input.milestone}`,
      result: input.evidence ?? "Milestone recorded with external verification",
      whySucceeded: input.evidence,
      recommendedImprovements: [`Document playbook for repeating ${input.milestone}`],
      source: "REAL",
      eventType: "milestone_achieved",
    });
  }

  return record;
}

export function syncPipelineMilestones(workspaceId: string, companyId: string): MilestoneRecord[] {
  const recorded: MilestoneRecord[] = [];
  const opportunities = getBusinessOpportunityRepository().listOpportunities(workspaceId, companyId);
  const approved = opportunities.find((o) => o.status === "APPROVED" || o.status === "READY_FOR_BUILD");

  if (approved && !getOperationFirstDollarRepository().getMilestoneByType(workspaceId, companyId, "FIRST_PRODUCT_SELECTED")) {
    recorded.push(recordMilestone({
      workspaceId,
      companyId,
      milestone: "FIRST_PRODUCT_SELECTED",
      source: "REAL",
      evidence: `Product ${approved.economics.productName} approved for build`,
      externalReference: approved.businessOpportunityId,
    }));
  }

  const connected = listConnectorRuntimeStates(workspaceId);
  const supplier = connected.find((s) =>
    ["cj-dropshipping", "aliexpress", "zendrop", "spocket"].includes(s.providerId) && s.lifecycle === "CONNECTED",
  );
  if (supplier && !getOperationFirstDollarRepository().getMilestoneByType(workspaceId, companyId, "FIRST_SUPPLIER_CONNECTED")) {
    recorded.push(recordMilestone({
      workspaceId,
      companyId,
      milestone: "FIRST_SUPPLIER_CONNECTED",
      source: "REAL",
      evidence: `Supplier ${supplier.providerId} connected`,
      externalReference: supplier.credentialsRef ?? supplier.providerId,
    }));
  }

  const marketplace = connected.find((s) =>
    ["shopify", "amazon-seller", "tiktok-shop", "ebay"].includes(s.providerId) && s.lifecycle === "CONNECTED",
  );
  if (marketplace && !getOperationFirstDollarRepository().getMilestoneByType(workspaceId, companyId, "FIRST_MARKETPLACE_CONNECTED")) {
    recorded.push(recordMilestone({
      workspaceId,
      companyId,
      milestone: "FIRST_MARKETPLACE_CONNECTED",
      source: "REAL",
      evidence: `Marketplace ${marketplace.providerId} connected`,
      externalReference: marketplace.credentialsRef ?? marketplace.providerId,
    }));
  }

  return recorded;
}

export function listMilestones(workspaceId: string, companyId: string): MilestoneRecord[] {
  syncPipelineMilestones(workspaceId, companyId);
  return getOperationFirstDollarRepository().listMilestones(workspaceId, companyId);
}

export function getFirstDollarTrackerSummary(workspaceId: string, companyId: string) {
  const milestones = listMilestones(workspaceId, companyId);
  const achievedSet = new Set(milestones.filter((m) => m.achieved).map((m) => m.milestone));
  return {
    milestones: MILESTONE_ORDER.map((milestone) => ({
      milestone,
      achieved: achievedSet.has(milestone),
      record: milestones.find((m) => m.milestone === milestone) ?? null,
      requiresReal: REAL_ONLY_MILESTONES.includes(milestone),
    })),
    achievedCount: achievedSet.size,
    totalCount: FIRST_DOLLAR_MILESTONES.length,
    nextMilestone: MILESTONE_ORDER.find((m) => !achievedSet.has(m)) ?? null,
  };
}

export function computeBusinessKpiSnapshot(workspaceId: string, companyId: string): BusinessKpiSnapshot {
  const repo = getOperationFirstDollarRepository();
  const simulations = getBusinessSimulationRepository().listSimulations(workspaceId, companyId);
  const latestSim = simulations[0];
  const realMilestones = repo.listMilestones(workspaceId, companyId).filter((m) => m.source === "REAL" && m.achieved);
  const hasRealSale = realMilestones.some((m) => m.milestone === "FIRST_SALE");
  const hasRealProfit = realMilestones.some((m) => m.milestone === "FIRST_PROFIT");

  const snapshot: BusinessKpiSnapshot = {
    snapshotId: `kpi-${randomUUID()}`,
    workspaceId,
    companyId,
    revenue: hasRealSale ? realMetric(0) : (latestSim ? simulatedMetric(latestSim.financialForecast.projectedRevenue / 365) : zeroRealMetric()),
    profit: hasRealProfit ? realMetric(0) : (latestSim ? simulatedMetric(latestSim.financialForecast.projectedNetProfit / 365) : zeroRealMetric()),
    margin: latestSim
      ? simulatedMetric(latestSim.financialForecast.marginAnalysis.netMarginPercent)
      : zeroRealMetric(),
    conversion: latestSim
      ? simulatedMetric(latestSim.commercialForecast.conversionRateEstimate)
      : zeroRealMetric(),
    orders: hasRealSale ? realMetric(1) : zeroRealMetric(),
    refunds: zeroRealMetric(),
    customerSatisfaction: zeroRealMetric(),
    growth: latestSim ? simulatedMetric(latestSim.simulationScore) : zeroRealMetric(),
    cashflow: latestSim
      ? simulatedMetric(latestSim.financialForecast.cashflowProjection[0]?.netCashflow ?? 0)
      : zeroRealMetric(),
    computedAt: now(),
  };

  if (hasRealSale) {
    snapshot.revenue = { ...snapshot.revenue, source: "REAL" };
  }

  return repo.saveKpiSnapshot(snapshot);
}

export function getLatestKpiSnapshot(workspaceId: string, companyId: string): BusinessKpiSnapshot {
  const existing = getOperationFirstDollarRepository().getLatestKpiSnapshot(workspaceId, companyId);
  if (existing) return existing;
  return computeBusinessKpiSnapshot(workspaceId, companyId);
}

export function recordEmpireLearning(input: {
  workspaceId: string;
  companyId: string;
  decision: string;
  result: string;
  whySucceeded?: string;
  whyFailed?: string;
  recommendedImprovements?: string[];
  source: MetricSource;
  eventType: string;
}): EmpireLearningRecord {
  const record: EmpireLearningRecord = {
    learningId: `lrn-${randomUUID()}`,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    decision: input.decision,
    result: input.result,
    whySucceeded: input.whySucceeded,
    whyFailed: input.whyFailed,
    recommendedImprovements: input.recommendedImprovements ?? [],
    source: input.source,
    eventType: input.eventType,
    permanentHistory: true,
    createdAt: now(),
  };
  getOperationFirstDollarRepository().saveLearning(record);
  captureOfdSoulRuntime(input.workspaceId, "Empire learning recorded", input.decision, { learningId: record.learningId });
  return record;
}

export function listEmpireLearning(workspaceId: string, companyId?: string, source?: MetricSource) {
  return getOperationFirstDollarRepository().listLearningRecords(workspaceId, companyId, source);
}

export function generateDailyExecutiveBrief(workspaceId: string, companyId: string): DailyExecutiveBrief {
  const launch = buildLaunchCommandCenter(workspaceId, companyId);
  const tracker = getFirstDollarTrackerSummary(workspaceId, companyId);
  const kpi = getLatestKpiSnapshot(workspaceId, companyId);

  const brief: DailyExecutiveBrief = {
    briefId: `brief-${randomUUID()}`,
    workspaceId,
    companyId,
    whatHappenedYesterday: tracker.achievedCount > 0
      ? `${tracker.achievedCount} First Dollar milestones achieved`
      : "Pipeline preparation in progress — no live milestones yet",
    whatChangedOvernight: launch.blockingIssues.length > 0
      ? `Blockers detected: ${launch.blockingIssues.slice(0, 2).join("; ")}`
      : "No new blockers — launch readiness improving",
    todaysHighestPriority: launch.dailyPriorities[0] ?? "Connect payment and supplier infrastructure",
    grandKingActionsToday: [
      launch.dailyPriorities[0] ?? "Review launch command center",
      tracker.nextMilestone ? `Work toward: ${tracker.nextMilestone}` : "Complete launch checklist",
      "Evaluate every action against USD 100,000 revenue objective",
    ],
    blockingRevenue: launch.blockingIssues,
    biggestOpportunity: launch.executiveRecommendations[0] ?? "First live product launch",
    source: "REAL",
    createdAt: now(),
  };

  getOperationFirstDollarRepository().saveBrief(brief);

  recordEmpireLearning({
    workspaceId,
    companyId,
    decision: "Generated daily executive brief",
    result: brief.todaysHighestPriority,
    whySucceeded: "Operational intelligence synthesised from live pipeline state",
    recommendedImprovements: brief.grandKingActionsToday,
    source: "REAL",
    eventType: "daily_brief_generated",
  });

  void kpi;
  return brief;
}

export function buildOperationFirstDollarDashboard(
  workspaceId: string,
  companyId: string,
): OperationFirstDollarDashboard {
  const launch = buildLaunchCommandCenter(workspaceId, companyId);
  const tracker = getFirstDollarTrackerSummary(workspaceId, companyId);
  const kpi = computeBusinessKpiSnapshot(workspaceId, companyId);
  const launchDate = getOperationFirstDollarRepository().getLaunchDate(workspaceId, companyId);
  const daysSinceLaunch = launchDate
    ? Math.max(0, Math.floor((Date.now() - new Date(launchDate).getTime()) / 86400000))
    : 0;

  const nextCritical = tracker.nextMilestone
    ? `Achieve ${tracker.nextMilestone}${REAL_ONLY_MILESTONES.includes(tracker.nextMilestone) ? " (REAL verification required)" : ""}`
    : "Maintain profitable operations";

  return {
    workspaceId,
    companyId,
    status: launch.currentPhase === "FIRST_DOLLAR" ? "FIRST DOLLAR ACHIEVED" : `Phase: ${launch.currentPhase}`,
    currentPhase: launch.currentPhase,
    revenueToday: { value: kpi.revenue.value, source: kpi.revenue.source },
    profitToday: { value: kpi.profit.value, source: kpi.profit.source },
    daysSinceLaunch,
    nextCriticalAction: nextCritical,
    empireLearningCount: getOperationFirstDollarRepository().countLearningRecords(workspaceId, companyId),
    milestonesAchieved: tracker.achievedCount,
    milestonesTotal: tracker.totalCount,
    computedAt: now(),
  };
}

export function recordRealBusinessEvent(input: {
  workspaceId: string;
  companyId: string;
  eventType: "sale" | "visitor" | "add_to_cart" | "shipment" | "payout" | "profit" | "refund";
  amountUsd?: number;
  externalReference: string;
  evidence: string;
}): { milestone?: MilestoneRecord; kpi: BusinessKpiSnapshot; learning: EmpireLearningRecord } {
  const milestoneMap: Partial<Record<typeof input.eventType, FirstDollarMilestone>> = {
    visitor: "FIRST_VISITOR",
    add_to_cart: "FIRST_ADD_TO_CART",
    sale: "FIRST_SALE",
    shipment: "FIRST_SHIPMENT",
    payout: "FIRST_PAYOUT",
    profit: "FIRST_PROFIT",
  };

  let milestone: MilestoneRecord | undefined;
  const ms = milestoneMap[input.eventType];
  if (ms && !getOperationFirstDollarRepository().getMilestoneByType(input.workspaceId, input.companyId, ms)) {
    milestone = recordMilestone({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      milestone: ms,
      source: "REAL",
      evidence: input.evidence,
      externalReference: input.externalReference,
    });
  }

  const kpi = computeBusinessKpiSnapshot(input.workspaceId, input.companyId);
  if (input.eventType === "sale" && input.amountUsd !== undefined) {
    kpi.snapshotId = `kpi-${randomUUID()}`;
    kpi.revenue = realMetric(input.amountUsd, input.externalReference);
    kpi.computedAt = now();
    getOperationFirstDollarRepository().saveKpiSnapshot(kpi);
  }
  if (input.eventType === "profit" && input.amountUsd !== undefined) {
    kpi.snapshotId = `kpi-${randomUUID()}`;
    kpi.profit = realMetric(input.amountUsd, input.externalReference);
    kpi.computedAt = now();
    getOperationFirstDollarRepository().saveKpiSnapshot(kpi);
  }

  const learning = recordEmpireLearning({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    decision: `Record real ${input.eventType} event`,
    result: input.evidence,
    whySucceeded: input.amountUsd !== undefined ? `Amount: USD ${input.amountUsd}` : undefined,
    recommendedImprovements: ["Replicate successful pattern", "Document in Empire Learning Repository"],
    source: "REAL",
    eventType: `real_${input.eventType}`,
  });

  return { milestone, kpi, learning };
}
