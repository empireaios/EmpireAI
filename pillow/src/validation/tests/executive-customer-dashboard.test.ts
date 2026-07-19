import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
} from "../../customer-identity-engine/index.js";
import {
  createCrmFoundationEngine,
  resetCrmFoundationForTesting,
} from "../../crm-foundation/index.js";
import {
  createCustomerTimelineEngine,
  resetCustomerTimelineEngineForTesting,
} from "../../customer-timeline-engine/index.js";
import type { AiCustomerSupport } from "../../ai-customer-support/engine.js";
import type { CustomerSentimentEngine } from "../../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../../review-management-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../../customer-risk-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../../customer-lifetime-value-engine/engine.js";
import {
  createCustomerSegmentationEngine,
  resetCustomerSegmentationEngineForTesting,
} from "../../customer-segmentation-engine/index.js";
import {
  createCustomerJourneyIntelligenceEngine,
  resetCustomerJourneyIntelligenceEngineForTesting,
} from "../../customer-journey-intelligence-engine/index.js";
import {
  createExecutiveCustomerDashboard,
  resetExecutiveCustomerDashboardForTesting,
  buildExecutiveCustomerDashboardConfiguration,
  EXECUTIVE_CUSTOMER_DASHBOARD_SYSTEM_PATH,
  ECD_METADATA_VERSION,
  ECD_CAPABILITIES,
} from "../../executive-customer-dashboard/index.js";
import { appendEcdLog, getEcdLogs } from "../../executive-customer-dashboard/ecd-logging.js";

async function buildDashboardStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Dashboard Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "dashboard@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "executive-team",
    contactInformation: { email: "dashboard@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordPurchase({
    customerId,
    eventReference: "purchase-1",
    eventDescription: "First purchase",
  });
  timeline.recordSupportActivity({
    customerId,
    eventReference: "support-1",
    eventDescription: "Support inquiry",
  });

  const segmentation = createCustomerSegmentationEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    null as unknown as CustomerSentimentEngine,
    null as unknown as LoyaltyProgrammeEngine,
    null as unknown as CustomerRiskEngine,
    null as unknown as CustomerLifetimeValueEngine,
  );
  await segmentation.initialize();
  segmentation.connectSegmentationEngine();

  const journey = createCustomerJourneyIntelligenceEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    null as unknown as CustomerSentimentEngine,
    null as unknown as CustomerLifetimeValueEngine,
    segmentation,
  );
  await journey.initialize();
  journey.connectJourneyIntelligenceEngine();

  const dashboard = createExecutiveCustomerDashboard(
    bootstrap,
    identity,
    crm,
    timeline,
    null as unknown as AiCustomerSupport,
    null as unknown as CustomerSentimentEngine,
    null as unknown as ReviewManagementEngine,
    null as unknown as LoyaltyProgrammeEngine,
    null as unknown as CustomerRiskEngine,
    null as unknown as CustomerLifetimeValueEngine,
    segmentation,
    journey,
    { configuration: { dashboardRefreshFrequencyMs: 1000 } },
  );
  await dashboard.initialize();
  return { dashboard, customerId };
}

describe("Executive Customer Dashboard (R4-18 / PILLOW-ECD-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetCustomerSegmentationEngineForTesting();
    resetCustomerJourneyIntelligenceEngineForTesting();
    resetExecutiveCustomerDashboardForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildExecutiveCustomerDashboardConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.kpiRules.length >= 1);
    assert.ok(config.defaultWidgets.length >= 1);
  });

  test("initializes with governance doc", async () => {
    const { dashboard } = await buildDashboardStack();
    const state = dashboard.getState();
    assert.equal(state.engineVersion, "PILLOW-ECD-001");
    assert.equal(state.missionId, "R4-18");
    assert.equal(state.status, "active");
    assert.ok(EXECUTIVE_CUSTOMER_DASHBOARD_SYSTEM_PATH.includes("EXECUTIVE_CUSTOMER"));
    assert.ok(ECD_CAPABILITIES.includes("growth_display"));
  });

  test("connect produces engine record with upstream links", async () => {
    const { dashboard } = await buildDashboardStack();
    const report = dashboard.connectExecutiveCustomerDashboard();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, ECD_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.customerJourneyIntelligenceEngineConnected, true);
  });

  test("refreshes dashboard with full customer snapshot", async () => {
    const { dashboard } = await buildDashboardStack();
    dashboard.connectExecutiveCustomerDashboard();
    const report = dashboard.refreshExecutiveCustomerDashboard({ forceRefresh: true });
    assert.equal(report.action, "refresh_dashboard");
    assert.equal(report.snapshots.length, 1);
    assert.match(report.snapshots[0].dashboardId, /^ecd-dash-/);
    assert.ok(report.snapshots[0].customerGrowthSummary.totalCustomers >= 1);
    assert.ok(report.snapshots[0].customerActivitySummary.totalEvents >= 1);
    assert.ok(report.widgets.length >= 1);
  });

  test("displays growth, activity, CLV, segmentation, sentiment, loyalty, journey, risk and support", async () => {
    const { dashboard } = await buildDashboardStack();
    dashboard.connectExecutiveCustomerDashboard();

    const growth = dashboard.displayCustomerGrowth();
    assert.equal(growth.action, "display_growth");
    assert.ok(growth.widgets.some((w) => w.widgetType === "growth"));

    const activity = dashboard.displayCustomerActivity();
    assert.equal(activity.action, "display_activity");

    const clv = dashboard.displayCustomerLifetimeValue();
    assert.equal(clv.action, "display_lifetime_value");

    const segmentation = dashboard.displayCustomerSegmentation();
    assert.equal(segmentation.action, "display_segmentation");

    const sentiment = dashboard.displayCustomerSentiment();
    assert.equal(sentiment.action, "display_sentiment");

    const loyalty = dashboard.displayCustomerLoyalty();
    assert.equal(loyalty.action, "display_loyalty");

    const journey = dashboard.displayCustomerJourneyAnalytics();
    assert.equal(journey.action, "display_journey");

    const risk = dashboard.displayCustomerRisk();
    assert.equal(risk.action, "display_risk");

    const support = dashboard.displayCustomerSupportMetrics();
    assert.equal(support.action, "display_support");
  });

  test("aggregates executive customer KPIs", async () => {
    const { dashboard } = await buildDashboardStack();
    dashboard.connectExecutiveCustomerDashboard();
    const report = dashboard.aggregateExecutiveCustomerKpis();
    assert.equal(report.action, "aggregate_kpis");
    assert.ok(report.snapshots[0].kpiSummary.kpis.length >= 1);
  });

  test("produces machine-readable dashboard snapshots", async () => {
    const { dashboard } = await buildDashboardStack();
    dashboard.connectExecutiveCustomerDashboard();
    const report = dashboard.refreshExecutiveCustomerDashboard({ forceRefresh: true });
    const dashboardId = report.snapshots[0].dashboardId;
    const machine = dashboard.getMachineReadableSnapshot(dashboardId);
    assert.ok(machine);
    assert.equal(machine!.dashboardId, dashboardId);
    assert.equal(machine!.metadataVersion, ECD_METADATA_VERSION);
  });

  test("reports dashboard status and health", async () => {
    const { dashboard } = await buildDashboardStack();
    dashboard.connectExecutiveCustomerDashboard();
    dashboard.refreshExecutiveCustomerDashboard({ forceRefresh: true });

    const status = dashboard.reportDashboardStatus();
    assert.equal(status.action, "report_status");
    assert.ok(status.snapshots.length >= 1);

    const health = dashboard.reportDashboardHealth();
    assert.equal(health.action, "report_health");
    assert.equal(health.validation.decision, "pass");
  });

  test("redacts sensitive log values", () => {
    appendEcdLog({
      event: "dashboard_refresh",
      level: "info",
      details: "token=secret-api-key-value should be redacted",
    });
    const logs = getEcdLogs(5);
    assert.match(logs.at(-1)!.details, /redacted/i);
  });

  test("cockpit snapshot and supervisor sync", async () => {
    const { dashboard } = await buildDashboardStack();
    dashboard.connectExecutiveCustomerDashboard();
    dashboard.refreshExecutiveCustomerDashboard({ forceRefresh: true });

    const cockpit = dashboard.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalSnapshots >= 1);

    const sync = dashboard.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 70);
  });
});
