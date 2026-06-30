import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { financialLedger } from "../../finance/ledger.js";
import type { ToolContext } from "../../brain/types.js";
import {
  CANONICAL_KPI_IDS,
  getKpiByKey,
  getKpiDashboard,
  initializeKpiEngine,
  kpiEngineTools,
  listKpiLifecycle,
  listKpiObservations,
  recordKpiBatch,
  recordKpiObservation,
  resetKpiRepository,
  syncKpisFromLedger,
  updateKpiTarget,
} from "../../foundation/kpi-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s008";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "kpi-engine",
    correlationId: "corr-s008",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = kpiEngineTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

function seedLedgerRevenue(workspaceId: string): void {
  const correlation = `kpi-test:${Date.now()}`;
  financialLedger.append({
    workspaceId,
    eventType: "sale",
    amountCents: 680_000,
    direction: "credit",
    correlationId: correlation,
    source: "kpi-test",
    description: "Test sale for KPI sync",
  });
  financialLedger.append({
    workspaceId,
    eventType: "supplier_cost",
    amountCents: 200_000,
    direction: "debit",
    correlationId: correlation,
    source: "kpi-test",
    description: "Test COGS for KPI sync",
  });
}

beforeEach(() => {
  configureValidationEnvironment();
  resetKpiRepository();
});

afterEach(() => {
  resetKpiRepository();
  resetDatabaseInstance();
});

describe("S008 KPI Engine", () => {
  it("registers eleven KPI engine Brain tools", () => {
    assert.equal(kpiEngineTools.length, 11);
    assert.ok(kpiEngineTools.some((tool) => tool.name === "kpi_engine.get_dashboard"));
    assert.ok(kpiEngineTools.some((tool) => tool.name === "kpi_engine.sync_from_ledger"));
  });

  it("seeds eight default Empire KPI metrics", () => {
    const metrics = initializeKpiEngine(WORKSPACE_ID);

    assert.equal(metrics.length, 8);
    assert.ok(metrics.some((m) => m.metricKey === "visitors"));
    assert.ok(metrics.some((m) => m.metricKey === "orders"));
    assert.ok(metrics.some((m) => m.metricKey === "revenue"));
    assert.ok(metrics.some((m) => m.metricKey === "profit"));
    assert.ok(metrics.some((m) => m.metricKey === "eaProfit"));
    assert.ok(metrics.some((m) => m.metricKey === "ecCapital"));
    assert.ok(metrics.some((m) => m.metricKey === "vProgress"));
    assert.ok(metrics.some((m) => m.metricKey === "founderGrowth"));
  });

  it("records KPI observations with previous value tracking", () => {
    initializeKpiEngine(WORKSPACE_ID);

    recordKpiObservation({
      workspaceId: WORKSPACE_ID,
      metricKey: "visitors",
      value: 1200,
      source: "analytics",
      actor: "founder@test.com",
    });

    const result = recordKpiObservation({
      workspaceId: WORKSPACE_ID,
      metricKey: "visitors",
      value: 1500,
      source: "analytics",
      actor: "founder@test.com",
    });

    assert.equal(result.metric.currentValue, 1500);
    assert.equal(result.metric.previousValue, 1200);
    assert.equal(result.metric.observationCount, 2);

    const observations = listKpiObservations(CANONICAL_KPI_IDS.VISITORS);
    assert.equal(observations.length, 2);
  });

  it("builds dashboard with deltas and progress to target", () => {
    initializeKpiEngine(WORKSPACE_ID);

    recordKpiObservation({
      workspaceId: WORKSPACE_ID,
      metricKey: "vProgress",
      value: 45,
      actor: "founder@test.com",
    });

    const dashboard = getKpiDashboard(WORKSPACE_ID);
    assert.equal(dashboard.metrics.length, 8);

    const vProgress = dashboard.metrics.find((m) => m.metricKey === "vProgress");
    assert.ok(vProgress);
    assert.equal(vProgress?.currentValue, 45);
    assert.equal(vProgress?.progressToTarget, 45);
  });

  it("syncs financial KPIs from ledger and treasury", () => {
    initializeKpiEngine(WORKSPACE_ID);
    seedLedgerRevenue(WORKSPACE_ID);

    const synced = syncKpisFromLedger(WORKSPACE_ID, "kpi-engine");
    assert.ok(synced.length >= 4);

    const revenue = getKpiByKey(WORKSPACE_ID, "revenue");
    assert.ok(revenue);
    assert.ok(revenue!.currentValue >= 680_000);

    const profit = getKpiByKey(WORKSPACE_ID, "profit");
    assert.ok(profit);

    const lifecycle = listKpiLifecycle(CANONICAL_KPI_IDS.REVENUE);
    assert.ok(lifecycle.some((entry) => entry.event === "SYNCED"));
  });

  it("tracks lifecycle events for observations and targets", () => {
    initializeKpiEngine(WORKSPACE_ID);

    assert.ok(
      listKpiLifecycle(CANONICAL_KPI_IDS.FOUNDER_GROWTH).some((e) => e.event === "REGISTERED"),
    );

    recordKpiObservation({
      workspaceId: WORKSPACE_ID,
      metricKey: "founderGrowth",
      value: 25,
      actor: "founder@test.com",
    });
    assert.ok(
      listKpiLifecycle(CANONICAL_KPI_IDS.FOUNDER_GROWTH).some((e) => e.event === "OBSERVATION_RECORDED"),
    );

    updateKpiTarget(CANONICAL_KPI_IDS.FOUNDER_GROWTH, 200, "founder@test.com");
    assert.ok(
      listKpiLifecycle(CANONICAL_KPI_IDS.FOUNDER_GROWTH).some((e) => e.event === "TARGET_SET"),
    );
  });

  it("records batch KPI observations", () => {
    initializeKpiEngine(WORKSPACE_ID);

    const metrics = recordKpiBatch(
      WORKSPACE_ID,
      [
        { metricKey: "visitors", value: 5000, source: "analytics" },
        { metricKey: "orders", value: 42, source: "order-pipeline" },
      ],
      "founder@test.com",
    );

    assert.equal(metrics.length, 2);
    assert.equal(getKpiByKey(WORKSPACE_ID, "visitors")?.currentValue, 5000);
    assert.equal(getKpiByKey(WORKSPACE_ID, "orders")?.currentValue, 42);
  });

  it("exposes KPI operations via Brain tools", async () => {
    const listed = (await invokeTool("kpi_engine.list")) as { metrics: unknown[] };
    assert.ok(Array.isArray(listed.metrics));
    assert.ok((listed.metrics as unknown[]).length >= 8);

    const dashboard = await invokeTool("kpi_engine.get_dashboard");
    assert.ok(dashboard && typeof dashboard === "object" && "metrics" in dashboard);
  });
});
