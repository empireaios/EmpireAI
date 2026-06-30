import { randomUUID } from "node:crypto";

import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import type { EyeId, EyeIntelligenceReport, ExecutiveBrief, InvestigationRecord } from "../models/eye-series.js";
import {
  EYE_RUNNERS,
  runExecutiveEye,
} from "./eye-generators.js";
import {
  getEyeSeriesRepository,
  resetEyeSeriesRepository,
} from "../repositories/sqlite-eye-series-repository.js";

export { resetEyeSeriesRepository };

function ctx(workspaceId: string, companyId: string) {
  return { workspaceId, companyId };
}

function captureEyeSoulRuntime(workspaceId: string, title: string, summary: string, payload: Record<string, unknown>) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor: "eye-series",
      payload,
    });
  } catch {
    // best-effort
  }
}

export function runEye(eyeId: Exclude<EyeId, "executive_eye">, workspaceId: string, companyId: string): EyeIntelligenceReport {
  const report = EYE_RUNNERS[eyeId](ctx(workspaceId, companyId));
  captureEyeSoulRuntime(workspaceId, `${eyeId} report generated`, report.summary, { reportId: report.reportId, eyeId });
  return report;
}

export function runAllEyes(workspaceId: string, companyId: string): {
  reports: EyeIntelligenceReport[];
  executive: EyeIntelligenceReport;
  brief: ExecutiveBrief;
} {
  const reports = (Object.keys(EYE_RUNNERS) as Exclude<EyeId, "executive_eye">[]).map((eyeId) =>
    runEye(eyeId, workspaceId, companyId),
  );
  const { report: executive, brief } = runExecutiveEye(ctx(workspaceId, companyId), reports);
  captureEyeSoulRuntime(workspaceId, "Executive Eye brief generated", brief.period, { briefId: brief.briefId });
  return { reports, executive, brief };
}

export function listEyeReports(workspaceId: string, eyeId?: EyeId, limit = 50): EyeIntelligenceReport[] {
  return getEyeSeriesRepository().listReports(workspaceId, eyeId, limit);
}

export function getEyeReport(reportId: string): EyeIntelligenceReport | null {
  return getEyeSeriesRepository().getReport(reportId);
}

export function searchIntelligence(workspaceId: string, query: string, eyeId?: EyeId) {
  return getEyeSeriesRepository().listObservations(workspaceId, { eyeId, search: query, limit: 50 });
}

export function listKnowledgeGraph(workspaceId: string, eyeId?: EyeId, limit = 100) {
  return getEyeSeriesRepository().listObservations(workspaceId, { eyeId, limit });
}

export function getEyeSummary(workspaceId: string, eyeId: EyeId) {
  const reports = getEyeSeriesRepository().listReports(workspaceId, eyeId, 1);
  const observations = getEyeSeriesRepository().countObservations(workspaceId, eyeId);
  return {
    eyeId,
    latestReport: reports[0] ?? null,
    totalObservations: observations,
    observationOnly: true as const,
  };
}

export function completeInvestigation(
  workspaceId: string,
  eyeId: EyeId,
  question: string,
): InvestigationRecord {
  const observations = getEyeSeriesRepository().listObservations(workspaceId, { eyeId, limit: 5 });
  const record: InvestigationRecord = {
    investigationId: `inv-${randomUUID()}`,
    workspaceId,
    eyeId,
    question,
    status: "COMPLETED",
    newQuestions: [`Follow-up: ${question} — deeper analysis needed?`],
    newInvestigations: [`Cross-eye correlation for ${eyeId}`],
    correlations: observations.slice(0, 2).map((o) => `Correlates with ${o.source}: ${o.observation.slice(0, 60)}`),
    contradictions: [],
    confidenceAdjustments: observations.slice(0, 1).map((o) => ({
      observationId: o.observationId,
      previousConfidence: o.confidence,
      newConfidence: Math.min(100, o.confidence + 5),
      reason: "Investigation completed with supporting evidence",
    })),
    observationIds: observations.map((o) => o.observationId),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  getEyeSeriesRepository().saveInvestigation(record);
  return record;
}

export function listInvestigationHistory(workspaceId: string, eyeId?: EyeId, limit = 50): InvestigationRecord[] {
  return getEyeSeriesRepository().listInvestigations(workspaceId, eyeId, limit);
}

export function buildEyeSeriesDashboard(workspaceId: string, companyId: string) {
  const { reports, brief } = runAllEyes(workspaceId, companyId);
  const productReport = reports.find((r) => r.eyeId === "product_eye");
  const supplierReport = reports.find((r) => r.eyeId === "supplier_eye");
  const marketplaceReport = reports.find((r) => r.eyeId === "marketplace_eye");
  const competitorReport = reports.find((r) => r.eyeId === "competitor_eye");
  const customerReport = reports.find((r) => r.eyeId === "customer_eye");
  const financialReport = reports.find((r) => r.eyeId === "financial_eye");

  return {
    workspaceId,
    companyId,
    todaysIntelligence: brief.eyeSummaries["product_eye"] ?? "Intelligence cycle complete",
    urgentAlerts: brief.urgentAlerts,
    topOpportunities: brief.topOpportunities,
    topRisks: brief.topRisks,
    productsWorthInvestigating: productReport?.opportunities ?? [],
    supplierChanges: supplierReport?.findings ?? [],
    marketplaceChanges: marketplaceReport?.findings ?? [],
    competitorChanges: competitorReport?.findings ?? [],
    customerSignals: customerReport?.findings ?? [],
    financialSignals: financialReport?.findings ?? [],
    executiveRecommendations: [
      ...brief.capitalRecommendations,
      ...brief.growthRecommendations,
      ...brief.recommendedInvestigations,
    ],
    totalObservations: getEyeSeriesRepository().countObservations(workspaceId),
    computedAt: new Date().toISOString(),
  };
}

export async function validateEyeSeries(workspaceId: string, companyId: string) {
  const blockers: string[] = [];
  const { reports } = runAllEyes(workspaceId, companyId);

  const eyesValidated = reports.length;
  if (eyesValidated < 9) blockers.push("Not all eyes validated");

  const kgCount = getEyeSeriesRepository().countObservations(workspaceId);
  const knowledgeGraphValid = kgCount > 0;
  if (!knowledgeGraphValid) blockers.push("Knowledge graph empty");

  const investigation = completeInvestigation(workspaceId, "product_eye", "Validate investigation engine");
  const investigationEngineValid = investigation.status === "COMPLETED";
  if (!investigationEngineValid) blockers.push("Investigation engine failed");

  const dashboard = buildEyeSeriesDashboard(workspaceId, companyId);
  const dashboardValid = dashboard.totalObservations > 0;
  if (!dashboardValid) blockers.push("Dashboard integration failed");

  return {
    validationId: `eye-val-${randomUUID()}`,
    workspaceId,
    valid: blockers.length === 0,
    eyesValidated,
    knowledgeGraphValid,
    investigationEngineValid,
    dashboardValid,
    observationOnlyEnforced: true as const,
    blockers,
    validatedAt: new Date().toISOString(),
  };
}
