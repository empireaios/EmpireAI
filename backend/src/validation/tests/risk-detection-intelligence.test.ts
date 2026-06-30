import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  DETECTION_SEVERITIES,
  RISK_ALERT_CATEGORIES,
  createInMemoryRiskDetectionIntelligenceRepository,
  createRiskDetectionIntelligenceModule,
  generateRiskDetection,
  validateRiskDetectionReport,
} from "../../execution/risk-detection-intelligence/index.js";

const WORKSPACE_ID = "ws-m096";

function buildRiskInput(storeId = randomUUID(), riskIndex = 55) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 84,
    },
    metrics: {
      currency: "USD",
      dailyVisitors: 290,
      previousDailyVisitors: 420,
      supplierName: "CJ Dropshipping",
      monthlyOrders: 340,
      adSpendMonthly: 4800,
      totalSkus: 14,
      organicTrafficChangePercent: -24,
    },
    storeId,
    riskIndex,
  };
}

describe("Mission 096 Risk Detection Intelligence Engine", () => {
  it("generates risk detection report with safety flags", async () => {
    const module = createRiskDetectionIntelligenceModule();
    const record = await module.persistDetection(WORKSPACE_ID, buildRiskInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoInterventionEnabled, false);
    assert.ok(record.confidence >= 0);
    assert.ok(record.signals.some((signal) => signal.signalType === "detection_composite"));
  });

  it("detects traffic drops above threshold", () => {
    const trafficDrop = generateRiskDetection(buildRiskInput()).trafficDrop;

    assert.equal(trafficDrop.detected, true);
    assert.ok(trafficDrop.dropPercent >= trafficDrop.thresholdPercent);
    assert.ok(DETECTION_SEVERITIES.includes(trafficDrop.severity));
    assert.ok(trafficDrop.summary.length > 0);
  });

  it("detects supplier failures", () => {
    const supplier = generateRiskDetection(buildRiskInput()).supplierFailure;

    assert.equal(supplier.detected, true);
    assert.equal(supplier.supplierName, "CJ Dropshipping");
    assert.ok(supplier.fulfillmentRatePercent < 90);
    assert.ok(supplier.failedOrders >= 1);
  });

  it("detects campaign failures below ROAS target", () => {
    const campaign = generateRiskDetection(buildRiskInput()).campaignFailure;

    assert.equal(campaign.detected, true);
    assert.ok(campaign.currentRoas < campaign.targetRoas);
    assert.ok(campaign.spendWasted > 0);
    assert.equal(campaign.currency, "USD");
  });

  it("detects chargeback risk above threshold", () => {
    const chargeback = generateRiskDetection(buildRiskInput()).chargebackRisk;

    assert.equal(chargeback.detected, true);
    assert.ok(chargeback.chargebackRatePercent >= chargeback.thresholdPercent);
    assert.ok(chargeback.chargebackCount >= 0);
    assert.ok(chargeback.topReason.length > 0);
  });

  it("detects inventory stockout risk", () => {
    const inventory = generateRiskDetection(buildRiskInput()).inventoryRisk;

    assert.equal(inventory.detected, true);
    assert.ok(inventory.daysOfCover <= inventory.reorderThresholdDays);
    assert.ok(inventory.lowStockSkus >= 1);
  });

  it("detects SEO penalty signals", () => {
    const seo = generateRiskDetection(buildRiskInput()).seoPenalty;

    assert.equal(seo.detected, true);
    assert.ok(seo.organicTrafficChangePercent <= -20);
    assert.ok(seo.suspectedPenalty.length > 0);
    assert.ok(seo.rankingDropKeywords >= 1);
  });

  it("generates alerts for detected risks", () => {
    const report = generateRiskDetection(buildRiskInput());

    assert.ok(report.alerts.length >= 4);
    assert.equal(report.totalAlerts, report.alerts.length);
    for (const alert of report.alerts) {
      assert.ok(RISK_ALERT_CATEGORIES.includes(alert.category));
      assert.ok(DETECTION_SEVERITIES.includes(alert.severity));
      assert.ok(alert.title.length > 0);
      assert.ok(alert.recommendedAction.length > 0);
    }
    assert.ok(report.alerts.some((alert) => alert.category === "TRAFFIC"));
    assert.ok(report.alerts.some((alert) => alert.category === "SEO"));
  });

  it("sorts alerts by severity priority", () => {
    const alerts = generateRiskDetection(buildRiskInput()).alerts;
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    for (let index = 1; index < alerts.length; index += 1) {
      const previous = alerts[index - 1]!;
      const current = alerts[index]!;
      assert.ok(priorityOrder[previous.severity] <= priorityOrder[current.severity]);
    }
  });

  it("reports fewer alerts when risk index is healthy", () => {
    const risky = generateRiskDetection(buildRiskInput(randomUUID(), 55));
    const healthy = generateRiskDetection({
      ...buildRiskInput(randomUUID(), 85),
      metrics: {
        currency: "USD",
        dailyVisitors: 410,
        previousDailyVisitors: 420,
        supplierName: "CJ Dropshipping",
        monthlyOrders: 340,
        adSpendMonthly: 4800,
        totalSkus: 14,
        organicTrafficChangePercent: -5,
      },
    });

    assert.ok(risky.alerts.length > healthy.alerts.length);
    assert.equal(healthy.trafficDrop.detected, false);
    assert.equal(healthy.supplierFailure.detected, false);
    assert.equal(healthy.campaignFailure.detected, false);
    assert.equal(healthy.seoPenalty.detected, false);
  });

  it("computes weighted confidence signals", () => {
    const report = generateRiskDetection(buildRiskInput());

    assert.ok(report.signals.length >= 7);
    const composite = report.signals.find(
      (signal) => signal.signalType === "detection_composite",
    );
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates risk detection report schema", () => {
    const report = generateRiskDetection(buildRiskInput());
    const validated = validateRiskDetectionReport({ reportId: randomUUID(), ...report });

    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoInterventionEnabled, false);
    assert.ok(validated.trafficDrop.detected);
    assert.equal(validated.totalAlerts, validated.alerts.length);
  });

  it("persists risk detection records in the repository", async () => {
    const repository = createInMemoryRiskDetectionIntelligenceRepository();
    const module = createRiskDetectionIntelligenceModule(repository);
    const input = buildRiskInput();

    const saved = await module.persistDetection(WORKSPACE_ID, input);
    const loadedByStore = await module.getDetectionByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getDetectionRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.totalAlerts, saved.totalAlerts);
    assert.equal(loadedById!.criticalAlerts, saved.criticalAlerts);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
