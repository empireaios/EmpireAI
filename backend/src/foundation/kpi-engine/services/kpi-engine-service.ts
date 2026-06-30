import { randomUUID } from "node:crypto";

import { financialLedger } from "../../../finance/ledger.js";
import { treasuryEngine } from "../../../treasury/treasury-engine.js";
import { captureSoulRuntimeEvent } from "../../soul-runtime/services/soul-runtime-engine.js";
import type {
  KpiDashboard,
  KpiDashboardEntry,
  KpiLifecycleRecord,
  KpiMetric,
  KpiMetricKey,
  KpiObservation,
  KpiObservationInput,
} from "../models/kpi-metric.js";
import {
  CANONICAL_KPI_IDS,
  computeDelta,
  computeProgressToTarget,
} from "../models/kpi-metric.js";
import { createDefaultKpiMetrics } from "./kpi-default-metrics.js";
import {
  createKpiLifecycleRecord,
  createKpiObservation,
  getKpiRepository,
} from "../repositories/sqlite-kpi-repository.js";

export class KpiNotFoundError extends Error {
  constructor(id: string) {
    super(`KPI metric not found: ${id}`);
    this.name = "KpiNotFoundError";
  }
}

function recordLifecycle(
  input: Omit<KpiLifecycleRecord, "lifecycleId" | "createdAt">,
): KpiLifecycleRecord {
  return getKpiRepository().appendLifecycle(createKpiLifecycleRecord(input));
}

function captureKpiSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  kpiId: string,
  value: number,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "kpis",
      title,
      summary,
      source: "system",
      actor,
      payload: { kpiId, value },
    });
  } catch {
    // Soul runtime capture is best-effort during KPI operations.
  }
}

function resolveMetric(input: { workspaceId: string; kpiId?: string; metricKey?: KpiMetricKey }): KpiMetric {
  const repository = getKpiRepository();
  if (input.kpiId) {
    const byId = repository.getMetricById(input.kpiId);
    if (!byId) {
      throw new KpiNotFoundError(input.kpiId);
    }
    return byId;
  }
  if (input.metricKey) {
    const byKey = repository.getMetricByKey(input.workspaceId, input.metricKey);
    if (!byKey) {
      throw new KpiNotFoundError(input.metricKey);
    }
    return byKey;
  }
  throw new KpiNotFoundError("unknown");
}

function toDashboardEntry(metric: KpiMetric): KpiDashboardEntry {
  const { delta, deltaPercent } = computeDelta(metric.currentValue, metric.previousValue);
  return {
    kpiId: metric.kpiId,
    metricKey: metric.metricKey,
    name: metric.name,
    unit: metric.unit,
    currentValue: metric.currentValue,
    previousValue: metric.previousValue,
    targetValue: metric.targetValue,
    delta,
    deltaPercent,
    progressToTarget: computeProgressToTarget(metric.currentValue, metric.targetValue),
  };
}

/** Idempotent seed of default Empire KPI metrics. */
export function initializeKpiEngine(workspaceId: string): KpiMetric[] {
  const repository = getKpiRepository();
  const existing = repository.listMetrics(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const metrics = createDefaultKpiMetrics(workspaceId);
  for (const metric of metrics) {
    repository.saveMetric(metric);
    recordLifecycle({
      kpiId: metric.kpiId,
      workspaceId,
      event: "REGISTERED",
      summary: `KPI metric registered: ${metric.name}`,
      actor: "kpi-engine",
      metadata: { metricKey: metric.metricKey, unit: metric.unit },
    });
  }

  return metrics;
}

export function recordKpiObservation(input: KpiObservationInput): {
  metric: KpiMetric;
  observation: KpiObservation;
} {
  initializeKpiEngine(input.workspaceId);
  const repository = getKpiRepository();
  const existing = resolveMetric({
    workspaceId: input.workspaceId,
    kpiId: input.kpiId,
    metricKey: input.metricKey,
  });

  const observation = repository.appendObservation(
    createKpiObservation({
      kpiId: existing.kpiId,
      workspaceId: input.workspaceId,
      value: input.value,
      source: input.source ?? "manual",
      actor: input.actor ?? "system",
      correlationId: input.correlationId,
      metadata: input.metadata ?? {},
    }),
  );

  const updated: KpiMetric = {
    ...existing,
    previousValue: existing.currentValue,
    currentValue: input.value,
    observationCount: existing.observationCount + 1,
    updatedAt: new Date().toISOString(),
  };

  repository.saveMetric(updated);
  recordLifecycle({
    kpiId: updated.kpiId,
    workspaceId: input.workspaceId,
    event: "OBSERVATION_RECORDED",
    summary: `${updated.name}: ${existing.currentValue} → ${input.value}`,
    actor: input.actor ?? "system",
    correlationId: input.correlationId,
    metadata: {
      value: String(input.value),
      source: input.source ?? "manual",
    },
  });
  captureKpiSoulRuntime(
    input.workspaceId,
    updated.name,
    `KPI updated to ${input.value}`,
    input.actor ?? "system",
    updated.kpiId,
    input.value,
  );

  return { metric: updated, observation };
}

export function updateKpiTarget(
  kpiId: string,
  targetValue: number,
  actor = "system",
): KpiMetric {
  const repository = getKpiRepository();
  const existing = repository.getMetricById(kpiId);
  if (!existing) {
    throw new KpiNotFoundError(kpiId);
  }

  const updated: KpiMetric = {
    ...existing,
    targetValue,
    updatedAt: new Date().toISOString(),
  };

  repository.saveMetric(updated);
  recordLifecycle({
    kpiId,
    workspaceId: updated.workspaceId,
    event: "TARGET_SET",
    summary: `Target set for ${updated.name}: ${targetValue}`,
    actor,
    metadata: { targetValue: String(targetValue) },
  });

  return updated;
}

export function getKpiMetric(kpiId: string): KpiMetric | null {
  return getKpiRepository().getMetricById(kpiId);
}

export function getKpiByKey(workspaceId: string, metricKey: KpiMetricKey): KpiMetric | null {
  initializeKpiEngine(workspaceId);
  return getKpiRepository().getMetricByKey(workspaceId, metricKey);
}

export function listKpiMetrics(workspaceId: string): KpiMetric[] {
  initializeKpiEngine(workspaceId);
  return getKpiRepository().listMetrics(workspaceId);
}

export function listKpiObservations(kpiId: string, limit = 100): KpiObservation[] {
  return getKpiRepository().listObservations(kpiId, limit);
}

export function listWorkspaceKpiObservations(workspaceId: string, limit = 100): KpiObservation[] {
  return getKpiRepository().listWorkspaceObservations(workspaceId, limit);
}

export function listKpiLifecycle(kpiId: string, limit = 100): KpiLifecycleRecord[] {
  return getKpiRepository().listLifecycle(kpiId, limit);
}

export function listWorkspaceKpiLifecycle(workspaceId: string, limit = 100): KpiLifecycleRecord[] {
  return getKpiRepository().listWorkspaceLifecycle(workspaceId, limit);
}

export function getKpiDashboard(workspaceId: string): KpiDashboard {
  const metrics = listKpiMetrics(workspaceId);
  return {
    workspaceId,
    metrics: metrics.map(toDashboardEntry),
    computedAt: new Date().toISOString(),
  };
}

/** Syncs financial KPIs from ledger and treasury — revenue truth doctrine. */
export function syncKpisFromLedger(workspaceId: string, actor = "kpi-engine"): KpiMetric[] {
  initializeKpiEngine(workspaceId);

  const summary = financialLedger.summarize(workspaceId);
  const report = financialLedger.generateReport(workspaceId);
  const treasury = treasuryEngine.compute(workspaceId);

  const saleCredits = summary.byType.sale?.credits ?? 0;

  const syncValues: Array<{ metricKey: KpiMetricKey; value: number; source: string }> = [
    {
      metricKey: "revenue",
      value: saleCredits,
      source: "financial-ledger",
    },
    {
      metricKey: "profit",
      value: report.netProfitCents,
      source: "financial-ledger",
    },
    {
      metricKey: "eaProfit",
      value: report.empireaiRoyaltyCents,
      source: "financial-ledger",
    },
    {
      metricKey: "ecCapital",
      value: treasury.buckets.available_cash,
      source: "treasury-engine",
    },
    {
      metricKey: "orders",
      value: saleCredits > 0 ? Math.max(1, Math.round(saleCredits / 6800)) : 0,
      source: "financial-ledger-derived",
    },
  ];

  const updated: KpiMetric[] = [];
  for (const entry of syncValues) {
    const result = recordKpiObservation({
      workspaceId,
      metricKey: entry.metricKey,
      value: entry.value,
      source: entry.source,
      actor,
      correlationId: randomUUID(),
    });
    updated.push(result.metric);
  }

  recordLifecycle({
    kpiId: CANONICAL_KPI_IDS.REVENUE,
    workspaceId,
    event: "SYNCED",
    summary: `Synced ${updated.length} financial KPIs from ledger/treasury`,
    actor,
    metadata: { count: String(updated.length) },
  });

  return updated;
}

export function recordKpiBatch(
  workspaceId: string,
  observations: Array<{ metricKey: KpiMetricKey; value: number; source?: string }>,
  actor = "system",
): KpiMetric[] {
  initializeKpiEngine(workspaceId);
  return observations.map((obs) =>
    recordKpiObservation({
      workspaceId,
      metricKey: obs.metricKey,
      value: obs.value,
      source: obs.source,
      actor,
      correlationId: randomUUID(),
    }).metric,
  );
}
