import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  EMPIRE_HEALTH_TIERS,
  MARGIN_HEALTH_STATUSES,
  MARKETING_HEALTH_STATUSES,
  ORDERS_HEALTH_STATUSES,
  REFUNDS_HEALTH_STATUSES,
  REVENUE_HEALTH_STATUSES,
  SUPPLIER_HEALTH_STATUSES,
  TRAFFIC_HEALTH_STATUSES,
  createEmpireHealthIntelligenceModule,
  createInMemoryEmpireHealthIntelligenceRepository,
  generateEmpireHealthReport,
  validateEmpireHealthReport,
} from "../../execution/empire-health-intelligence/index.js";

const WORKSPACE_ID = "ws-m095";

function buildHealthInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 88,
    },
    metrics: {
      price: 89.99,
      currency: "USD",
      monthlyOrders: 360,
      monthlyVisitors: 10200,
      grossMarginPercent: 57,
      adSpendMonthly: 4800,
      supplierName: "CJ Dropshipping",
    },
    storeId,
    healthIndex: 82,
  };
}

describe("Mission 095 Empire Health Intelligence Engine", () => {
  it("generates health report with safety flags", async () => {
    const module = createEmpireHealthIntelligenceModule();
    const record = await module.persistHealthReport(WORKSPACE_ID, buildHealthInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoInterventionEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.empireHealthScore.overallScore >= 0);
    assert.ok(record.signals.some((signal) => signal.signalType === "empire_composite"));
  });

  it("monitors revenue health", () => {
    const revenue = generateEmpireHealthReport(buildHealthInput()).revenue;

    assert.ok(revenue.monthlyRevenue >= 0);
    assert.ok(REVENUE_HEALTH_STATUSES.includes(revenue.status));
    assert.equal(revenue.currency, "USD");
    assert.ok(revenue.score >= 0 && revenue.score <= 100);
    assert.ok(revenue.summary.length > 0);
  });

  it("monitors traffic health", () => {
    const traffic = generateEmpireHealthReport(buildHealthInput()).traffic;

    assert.ok(traffic.monthlyVisitors >= 0);
    assert.ok(TRAFFIC_HEALTH_STATUSES.includes(traffic.status));
    assert.ok(traffic.bounceRatePercent >= 0 && traffic.bounceRatePercent <= 100);
    assert.ok(traffic.conversionRatePercent >= 0);
  });

  it("monitors margin health", () => {
    const margins = generateEmpireHealthReport(buildHealthInput()).margins;

    assert.equal(margins.grossMarginPercent, 57);
    assert.ok(MARGIN_HEALTH_STATUSES.includes(margins.status));
    assert.ok(margins.costOfGoodsSold >= 0);
    assert.equal(margins.currency, "USD");
  });

  it("monitors orders health", () => {
    const orders = generateEmpireHealthReport(buildHealthInput()).orders;

    assert.equal(orders.monthlyOrders, 360);
    assert.ok(ORDERS_HEALTH_STATUSES.includes(orders.status));
    assert.equal(orders.averageOrderValue, 89.99);
    assert.ok(orders.fulfillmentRatePercent >= 0 && orders.fulfillmentRatePercent <= 100);
  });

  it("monitors refunds health", () => {
    const refunds = generateEmpireHealthReport(buildHealthInput()).refunds;

    assert.ok(refunds.refundRatePercent >= 0 && refunds.refundRatePercent <= 100);
    assert.ok(REFUNDS_HEALTH_STATUSES.includes(refunds.status));
    assert.ok(refunds.refundCount >= 0);
    assert.ok(refunds.topReason.length > 0);
  });

  it("monitors supplier health", () => {
    const supplier = generateEmpireHealthReport(buildHealthInput()).supplier;

    assert.ok(SUPPLIER_HEALTH_STATUSES.includes(supplier.status));
    assert.equal(supplier.primarySupplier, "CJ Dropshipping");
    assert.ok(supplier.fulfillmentRatePercent >= 0 && supplier.fulfillmentRatePercent <= 100);
    assert.ok(supplier.averageLeadTimeDays >= 0);
  });

  it("monitors marketing health", () => {
    const marketing = generateEmpireHealthReport(buildHealthInput()).marketing;

    assert.ok(MARKETING_HEALTH_STATUSES.includes(marketing.status));
    assert.ok(marketing.roas >= 0);
    assert.ok(marketing.activeCampaigns >= 0);
    assert.ok(marketing.emailOpenRatePercent >= 0 && marketing.emailOpenRatePercent <= 100);
  });

  it("computes overall Empire Health Score", () => {
    const report = generateEmpireHealthReport(buildHealthInput());
    const score = report.empireHealthScore;

    assert.ok(score.overallScore >= 0 && score.overallScore <= 100);
    assert.ok(EMPIRE_HEALTH_TIERS.includes(score.tier));
    assert.equal(
      score.healthyDimensions + score.warningDimensions + score.criticalDimensions,
      7,
    );
    assert.match(score.headline, /Empire Health Score/);
    assert.ok(score.summary.length > 0);
  });

  it("computes weighted confidence signals", () => {
    const report = generateEmpireHealthReport(buildHealthInput());

    assert.ok(report.signals.length >= 7);
    const composite = report.signals.find((signal) => signal.signalType === "empire_composite");
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates empire health report schema", () => {
    const report = generateEmpireHealthReport(buildHealthInput());
    const validated = validateEmpireHealthReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.revenue.monthlyRevenue >= 0);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoInterventionEnabled, false);
    assert.ok(validated.empireHealthScore.overallScore >= 0);
  });

  it("persists empire health records in the repository", async () => {
    const repository = createInMemoryEmpireHealthIntelligenceRepository();
    const module = createEmpireHealthIntelligenceModule(repository);
    const input = buildHealthInput();

    const saved = await module.persistHealthReport(WORKSPACE_ID, input);
    const loadedByStore = await module.getHealthByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getHealthRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(
      loadedById!.empireHealthScore.overallScore,
      saved.empireHealthScore.overallScore,
    );

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
