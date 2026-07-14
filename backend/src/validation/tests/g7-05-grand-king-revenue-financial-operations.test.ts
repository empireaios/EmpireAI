import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FINANCIAL_DOMAIN_IDS,
  FINANCIAL_EKLS_KINDS,
  FINANCIAL_STATUSES,
  GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_VERSION,
  aggregateFinancialKpis,
  aggregateExpenses,
  aggregateRevenue,
  buildCockpitRevenueFinancialOperationsView,
  buildExecutiveFinanceDashboard,
  computeProfitability,
  createGrandKingRevenueFinancialOperationsModuleContract,
  deriveRateSignalFromRef,
  getCashPosition,
  getExecutiveFinancialSummary,
  getFinancialOperationsOverview,
  getFinancialStatus,
  grandKingRevenueFinancialOperationsTools,
  initializeFinancialOperations,
  isValidFinancialStatusTransition,
  listFinancialEklsKinds,
  listFinancialOperationsPlugins,
  listFinancialOperationsRegistryIds,
  listFinancialRecords,
  reconcileFinancialRecord,
  redactFinancialSecrets,
  registerFinancialOperationsPlugin,
  resetGrandKingRevenueFinancialOperationsHarnessForTests,
  resolveFinancialOperationDependencies,
  searchFinancialEklsObservations,
  trackAdvertisingSpend,
  trackPayouts,
  trackRefunds,
  trackSubscriptions,
  validateFinancialOperationsPillowGovernance,
} from "../../orchestration/grand-king-revenue-financial-operations/index.js";
import {
  initializeExecutiveDecisionCentre,
  resetGrandKingExecutiveDecisionCentreHarnessForTests,
} from "../../orchestration/grand-king-executive-decision-centre/index.js";
import {
  initializeAutomationOperations,
  resetGrandKingBusinessAutomationOperationsHarnessForTests,
} from "../../orchestration/grand-king-business-automation-operations/index.js";
import {
  initializeCommerceOperations,
  resetGrandKingCommerceOperationsHarnessForTests,
} from "../../orchestration/grand-king-commerce-operations/index.js";
import { resetGrandKingLiveOperationsHarnessForTests } from "../../orchestration/grand-king-live-operations/index.js";
import {
  activateGrandKingProductionWorkspace,
  createGrandKingProductionWorkspace,
  resetGrandKingProductionWorkspaceHarnessForTests,
} from "../../orchestration/grand-king-production-workspace/index.js";
import {
  resetProductionCertificationHarnessForTests,
  runFinalProductionReadinessCertification,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  ownerId: "grand-king",
  pillowGovernance: true as const,
};

async function seedProductionStack(): Promise<void> {
  resetProductionCertificationHarnessForTests();
  resetGrandKingLiveOperationsHarnessForTests();
  resetGrandKingProductionWorkspaceHarnessForTests();
  resetGrandKingCommerceOperationsHarnessForTests();
  resetGrandKingBusinessAutomationOperationsHarnessForTests();
  resetGrandKingExecutiveDecisionCentreHarnessForTests();
  resetGrandKingRevenueFinancialOperationsHarnessForTests();
  process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "false";
  await runFinalProductionReadinessCertification({
    context: { workspaceId: "ws-foundation" },
    actorId: TEST_ACTOR.actorId,
    workspaceId: "ws-foundation",
    pillowGovernance: true,
  });
  createGrandKingProductionWorkspace({
    context: { workspaceId: CANONICAL_WORKSPACE_ID },
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });
  activateGrandKingProductionWorkspace({
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });
  initializeCommerceOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeAutomationOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeExecutiveDecisionCentre({ workspaceId: CANONICAL_WORKSPACE_ID });
}

async function seedFinancialOperations() {
  await seedProductionStack();
  return initializeFinancialOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
}

describe("G7-05 — Grand King Revenue & Financial Operations", () => {
  it("exposes financial operations framework version and domains", () => {
    assert.equal(GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_VERSION, "g7-05-v1");
    assert.equal(FINANCIAL_DOMAIN_IDS.length, 13);
    assert.equal(FINANCIAL_STATUSES.length, 8);
  });

  it("registers grand-king-revenue-financial-operations Brain module contract", () => {
    const contract = createGrandKingRevenueFinancialOperationsModuleContract();
    assert.equal(contract.moduleId, "grand-king-revenue-financial-operations");
    assert.equal(contract.missionId, "G7-05");
    assert.equal(contract.programmeStatus, "revenue-financial-operations-established");
    assert.ok(contract.integratesWith.includes("cockpit"));
  });

  it("initializes financial records with full contract fields", async () => {
    const result = await seedFinancialOperations();
    assert.ok(result.records.length >= 1);

    for (const record of result.records) {
      assert.ok(record.financialRecordId);
      assert.equal(record.workspaceId, CANONICAL_WORKSPACE_ID);
      assert.ok(record.brandId);
      assert.ok(record.providerId);
      assert.ok(record.transactionType);
      assert.ok(record.currency);
      assert.ok(typeof record.grossAmount === "number");
      assert.ok(typeof record.fees === "number");
      assert.ok(typeof record.refundAmount === "number");
      assert.ok(typeof record.taxAmount === "number");
      assert.ok(typeof record.netAmount === "number");
      assert.ok(record.status);
      assert.ok(record.reconciliationStatus);
      assert.ok(Array.isArray(record.evidence));
      assert.ok(record.createdAt);
      assert.ok(record.updatedAt);
      assert.ok(record.correlationId);
      assert.ok(record.governanceState);
    }
  });

  it("aggregates revenue and expenses from ledger", async () => {
    await seedFinancialOperations();
    const revenue = aggregateRevenue({ workspaceId: CANONICAL_WORKSPACE_ID });
    const expenses = aggregateExpenses({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(revenue.grossRevenue >= 0);
    assert.ok(revenue.netRevenue >= 0);
    assert.ok(expenses.totalExpenses >= 0);
  });

  it("computes profitability and cash flow", async () => {
    await seedFinancialOperations();
    const profitability = computeProfitability({ workspaceId: CANONICAL_WORKSPACE_ID });
    const cash = getCashPosition({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(typeof profitability.netProfit === "number");
    assert.ok(typeof profitability.profitMargin === "number");
    assert.ok(typeof cash.cashAvailable === "number");
    assert.ok(cash.currency);
  });

  it("aggregates financial KPIs", async () => {
    await seedFinancialOperations();
    const kpis = aggregateFinancialKpis({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(kpis.grossRevenue >= 0);
    assert.ok(kpis.netRevenue >= 0);
    assert.ok(typeof kpis.subscriptionMrr === "number");
    assert.ok(typeof kpis.advertisingRoi === "number");
    assert.ok(kpis.policyReference);
  });

  it("validates financial status lifecycle transitions", () => {
    assert.equal(isValidFinancialStatusTransition("pending", "processing"), true);
    assert.equal(isValidFinancialStatusTransition("completed", "reconciled"), true);
    assert.equal(isValidFinancialStatusTransition("reconciled", "pending"), false);
  });

  it("registers all required financial Brain tools", () => {
    const names = new Set(grandKingRevenueFinancialOperationsTools.map((tool) => tool.name));
    for (const toolName of [
      "financial_overview",
      "financial_summary",
      "financial_dashboard",
      "profitability_report",
      "cash_position",
      "advertising_roi",
      "subscription_metrics",
      "financial_risk_register",
      "financial_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for financial operations", async () => {
    await seedProductionStack();
    const result = validateFinancialOperationsPillowGovernance({
      ...TEST_ACTOR,
      operation: "aggregate",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.financialAuthority, true);
    assert.equal(result.workspaceAuthority, true);
    assert.equal(result.transactionVisibility, true);
    assert.equal(result.financialIntegrity, true);
    assert.equal(result.executiveAuthority, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records financial EKLS observations through Pillow", async () => {
    await seedFinancialOperations();
    assert.deepEqual(listFinancialEklsKinds(), [...FINANCIAL_EKLS_KINDS]);

    const search = searchFinancialEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "financial_record_created",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit financial operations backend contract", async () => {
    await seedFinancialOperations();
    const overview = getFinancialOperationsOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = buildExecutiveFinanceDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getExecutiveFinancialSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitRevenueFinancialOperationsView({
      overview,
      kpis: dashboard.kpis,
      profitability: dashboard.profitability,
      cashPosition: getCashPosition({ workspaceId: CANONICAL_WORKSPACE_ID }),
      payoutStatus: dashboard.payouts,
      advertisingRoi: dashboard.advertising,
      subscriptionMetrics: dashboard.subscriptions,
      records: dashboard.records,
      executiveFinancialSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-revenue-financial-operations");
    assert.equal(view.dataMode, "financial");
    assert.equal(view.designLanguage, "g4-cockpit");
    assert.ok(view.financialKpis.grossRevenue >= 0);
    assert.ok(view.revenueDashboard.recordsByDomain.length >= 0);
  });

  it("lists financial operations registry ids", () => {
    const ids = listFinancialOperationsRegistryIds();
    assert.equal(ids.length, 4);
    assert.ok(ids.includes("REG-FINANCIAL-POLICY"));
    assert.ok(ids.includes("REG-COMMERCE-POLICY"));
    assert.ok(ids.includes("REG-CONNECTION-PROVIDER"));
    assert.ok(ids.includes("REG-READINESS-POLICY"));
  });

  it("supports financial operations plugins without modifying core", async () => {
    await seedFinancialOperations();
    for (const pluginKind of [
      "payment_provider",
      "financial_provider",
      "ledger_provider",
      "roi_analyser",
      "financial_report",
    ] as const) {
      const result = registerFinancialOperationsPlugin({
        manifest: {
          pluginId: `test-${pluginKind}`,
          pluginName: `Test ${pluginKind}`,
          pluginKind,
          pillowGovernance: true,
        },
        actorId: TEST_ACTOR.actorId,
        workspaceId: CANONICAL_WORKSPACE_ID,
        ownerId: TEST_ACTOR.ownerId,
        pillowGovernance: true,
      });
      assert.equal(result.accepted, true);
    }
    assert.equal(listFinancialOperationsPlugins().length, 5);
  });

  it("resolves registry-driven fee signals without hardcoded providers", () => {
    const rate = deriveRateSignalFromRef("fee:stripe-processing");
    assert.ok(rate > 0 && rate < 0.1);
    const deps = resolveFinancialOperationDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(deps.feeRateRefs.length >= 1);
    assert.ok(deps.domainRefs.length >= 13);
  });

  it("tracks payouts, subscriptions, advertising and refunds", async () => {
    await seedFinancialOperations();
    const payouts = trackPayouts();
    const subscriptions = trackSubscriptions({ workspaceId: CANONICAL_WORKSPACE_ID });
    const advertising = trackAdvertisingSpend({ workspaceId: CANONICAL_WORKSPACE_ID });
    const refunds = trackRefunds();
    assert.ok(payouts.payouts.length >= 0);
    assert.ok(typeof subscriptions.mrr === "number");
    assert.ok(typeof advertising.roi === "number");
    assert.ok(typeof refunds.refundRate === "number");
  });

  it("reconciles financial records through Pillow governance", async () => {
    await seedFinancialOperations();
    const pending = listFinancialRecords().find((r) => r.status === "completed");
    assert.ok(pending);
    const reconciled = reconcileFinancialRecord({
      ...TEST_ACTOR,
      financialRecordId: pending!.financialRecordId,
    });
    assert.equal(reconciled.status, "reconciled");
  });

  it("redacts secrets from financial output", async () => {
    await seedFinancialOperations();
    const status = getFinancialStatus({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = buildExecutiveFinanceDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const redacted = redactFinancialSecrets({ status, dashboard, secret: "sk_live_abc", token: "api_key_xyz" });
    const serialized = JSON.stringify(redacted);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("[REDACTED]"), true);
  });

  it("does not expose credentials or payment data in financial output", async () => {
    await seedFinancialOperations();
    const dashboard = buildExecutiveFinanceDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify(dashboard);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("customer_payment"), false);
  });
});
