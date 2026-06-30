import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  ALERT_CATEGORIES,
  ALERT_SEVERITIES,
  INVENTORY_STATUSES,
  MANUFACTURING_STATUSES,
  REVENUE_TRENDS,
  createExecutiveDashboardIntelligenceModule,
  createInMemoryExecutiveDashboardIntelligenceRepository,
  generateExecutiveDashboard,
  validateExecutiveDashboardReport,
} from "../../execution/executive-dashboard-intelligence/index.js";

const WORKSPACE_ID = "ws-m091";

function buildDashboardInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 86,
    },
    metrics: {
      price: 89.99,
      currency: "USD",
      monthlyOrders: 340,
      monthlyVisitors: 9800,
      adSpendMonthly: 4500,
      grossMarginPercent: 58,
      totalSkus: 14,
      activeCampaigns: 5,
    },
    storeId,
    performanceIndex: 78,
  };
}

describe("Mission 091 Executive Dashboard Intelligence Engine", () => {
  it("generates executive dashboard with safety flags", async () => {
    const module = createExecutiveDashboardIntelligenceModule();
    const record = await module.persistDashboard(WORKSPACE_ID, buildDashboardInput());

    assert.ok(record.reportId);
    assert.match(record.dashboardName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoRefreshEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.overallScore >= 50);
    assert.ok(record.signals.some((signal) => signal.signalType === "dashboard_composite"));
  });

  it("includes revenue widget with trend", () => {
    const revenue = generateExecutiveDashboard(buildDashboardInput()).revenue;

    assert.ok(revenue.monthlyRevenue >= 0);
    assert.ok(REVENUE_TRENDS.includes(revenue.trend));
    assert.equal(revenue.currency, "USD");
    assert.ok(revenue.score >= 0 && revenue.score <= 100);
    assert.ok(revenue.summary.length > 0);
  });

  it("includes orders widget with conversion metrics", () => {
    const orders = generateExecutiveDashboard(buildDashboardInput()).orders;

    assert.ok(orders.monthlyOrders >= 0);
    assert.equal(orders.averageOrderValue, 89.99);
    assert.ok(orders.conversionRatePercent >= 0 && orders.conversionRatePercent <= 100);
    assert.ok(orders.fulfillmentRatePercent >= 0 && orders.fulfillmentRatePercent <= 100);
  });

  it("includes visitors widget with traffic metrics", () => {
    const visitors = generateExecutiveDashboard(buildDashboardInput()).visitors;

    assert.ok(visitors.monthlyVisitors >= 0);
    assert.ok(visitors.uniqueVisitors <= visitors.monthlyVisitors);
    assert.ok(visitors.bounceRatePercent >= 0 && visitors.bounceRatePercent <= 100);
    assert.ok(visitors.sessionDurationSeconds >= 0);
    assert.ok(visitors.topSource.length > 0);
  });

  it("includes ROAS widget with break-even comparison", () => {
    const roas = generateExecutiveDashboard(buildDashboardInput()).roas;

    assert.ok(roas.currentRoas >= 0);
    assert.ok(roas.targetRoas >= roas.breakEvenRoas);
    assert.ok(roas.adSpendMonthly >= 0);
    assert.ok(roas.revenueFromAds >= 0);
  });

  it("includes profit widget with margin breakdown", () => {
    const profit = generateExecutiveDashboard(buildDashboardInput()).profit;

    assert.ok(profit.grossMarginPercent >= 0 && profit.grossMarginPercent <= 100);
    assert.ok(profit.netMarginPercent >= -100 && profit.netMarginPercent <= 100);
    assert.equal(profit.currency, "USD");
  });

  it("includes inventory widget with stock status", () => {
    const inventory = generateExecutiveDashboard(buildDashboardInput()).inventory;

    assert.ok(INVENTORY_STATUSES.includes(inventory.status));
    assert.ok(inventory.totalSkus >= inventory.inStockSkus);
    assert.ok(inventory.daysOfCover >= 0);
    assert.ok(inventory.restockAlerts >= 0);
  });

  it("includes marketing widget with campaign metrics", () => {
    const marketing = generateExecutiveDashboard(buildDashboardInput()).marketing;

    assert.equal(marketing.activeCampaigns, 5);
    assert.ok(marketing.emailOpenRatePercent >= 0 && marketing.emailOpenRatePercent <= 100);
    assert.ok(marketing.clickThroughRatePercent >= 0 && marketing.clickThroughRatePercent <= 100);
    assert.ok(marketing.topChannel.length > 0);
  });

  it("includes manufacturing widget with loop status", () => {
    const manufacturing = generateExecutiveDashboard(buildDashboardInput()).manufacturing;

    assert.ok(MANUFACTURING_STATUSES.includes(manufacturing.status));
    assert.ok(manufacturing.activeLoops >= 0);
    assert.ok(manufacturing.successRatePercent >= 0 && manufacturing.successRatePercent <= 100);
  });

  it("includes Eye widget with intelligence signals", () => {
    const eye = generateExecutiveDashboard(buildDashboardInput()).eye;

    assert.ok(eye.activeConnectors >= 1);
    assert.ok(eye.signalsIngested >= 0);
    assert.ok(eye.lastSyncAt.length > 0);
    assert.ok(eye.topInsight.length > 0);
  });

  it("includes alerts widget with categorized alerts", () => {
    const alerts = generateExecutiveDashboard(buildDashboardInput()).alerts;

    assert.ok(alerts.totalAlerts >= 1);
    assert.equal(alerts.totalAlerts, alerts.alerts.length);
    for (const alert of alerts.alerts) {
      assert.ok(ALERT_CATEGORIES.includes(alert.category));
      assert.ok(ALERT_SEVERITIES.includes(alert.severity));
      assert.ok(alert.title.length > 0);
      assert.ok(alert.message.length > 0);
    }
  });

  it("computes weighted confidence signals", () => {
    const report = generateExecutiveDashboard(buildDashboardInput());

    assert.ok(report.signals.length >= 10);
    const composite = report.signals.find((signal) => signal.signalType === "dashboard_composite");
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates executive dashboard report schema", () => {
    const report = generateExecutiveDashboard(buildDashboardInput());
    const validated = validateExecutiveDashboardReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.revenue.monthlyRevenue >= 0);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoRefreshEnabled, false);
    assert.ok(validated.alerts.alerts.length >= 1);
  });

  it("persists executive dashboard records in the repository", async () => {
    const repository = createInMemoryExecutiveDashboardIntelligenceRepository();
    const module = createExecutiveDashboardIntelligenceModule(repository);
    const input = buildDashboardInput();

    const saved = await module.persistDashboard(WORKSPACE_ID, input);
    const loadedByStore = await module.getDashboardByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getDashboardRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(loadedById!.marketing.activeCampaigns, saved.marketing.activeCampaigns);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
