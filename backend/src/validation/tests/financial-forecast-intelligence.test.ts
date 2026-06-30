import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createFinancialForecastIntelligenceModule,
  createInMemoryFinancialForecastIntelligenceRepository,
  generateFinancialForecast,
  RISK_SEVERITIES,
  SCENARIO_TYPES,
  validateFinancialForecastReport,
} from "../../execution/financial-forecast-intelligence/index.js";

const WORKSPACE_ID = "ws-m090";

function buildForecastInput(storeId = randomUUID()) {
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
    offer: {
      offerName: "Premium Kitchen Blender Bundle",
      price: 89.99,
      currency: "USD",
      monthlyOrders: 320,
      adSpendMonthly: 4200,
      grossMarginPercent: 58,
      fixedCostsMonthly: 6800,
    },
    storeId,
    revenueIndex: 76,
  };
}

describe("Mission 090 Financial Forecast Intelligence Engine", () => {
  it("generates financial forecast with safety flags", async () => {
    const module = createFinancialForecastIntelligenceModule();
    const record = await module.persistForecast(WORKSPACE_ID, buildForecastInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoApplyEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.overallScore >= 50);
    assert.ok(record.signals.some((signal) => signal.signalType === "forecast_composite"));
  });

  it("forecasts revenue with growth rate", () => {
    const revenue = generateFinancialForecast(buildForecastInput()).revenue;

    assert.ok(revenue.monthlyRevenue >= 0);
    assert.equal(revenue.quarterlyRevenue, Math.round(revenue.monthlyRevenue * 3 * 100) / 100);
    assert.equal(revenue.annualRevenue, Math.round(revenue.monthlyRevenue * 12 * 100) / 100);
    assert.ok(revenue.growthRatePercent >= 0);
    assert.equal(revenue.currency, "USD");
    assert.ok(revenue.score >= 0 && revenue.score <= 100);
  });

  it("forecasts profit with margin breakdown", () => {
    const report = generateFinancialForecast(buildForecastInput());

    assert.ok(report.profit.monthlyProfit !== undefined);
    assert.equal(
      report.profit.quarterlyProfit,
      Math.round(report.profit.monthlyProfit * 3 * 100) / 100,
    );
    assert.ok(report.profit.grossMarginPercent >= 0 && report.profit.grossMarginPercent <= 100);
    assert.ok(report.profit.netMarginPercent >= -100 && report.profit.netMarginPercent <= 100);
  });

  it("forecasts ROAS against break-even threshold", () => {
    const roas = generateFinancialForecast(buildForecastInput()).roas;

    assert.ok(roas.currentRoas >= 0);
    assert.ok(roas.projectedRoas >= 0);
    assert.ok(roas.adSpendMonthly >= 0);
    assert.ok(roas.revenueFromAds >= 0);
    assert.ok(roas.breakEvenRoas >= 0);
    assert.ok(roas.score >= 0 && roas.score <= 100);
  });

  it("forecasts cash flow and runway", () => {
    const cashFlow = generateFinancialForecast(buildForecastInput()).cashFlow;

    assert.ok(cashFlow.monthlyInflow >= 0);
    assert.ok(cashFlow.monthlyOutflow >= 0);
    assert.equal(
      cashFlow.netCashFlow,
      Math.round((cashFlow.monthlyInflow - cashFlow.monthlyOutflow) * 100) / 100,
    );
    assert.ok(cashFlow.runwayMonths >= 0);
    assert.equal(cashFlow.currency, "USD");
  });

  it("analyzes breakeven units and timeline", () => {
    const breakeven = generateFinancialForecast(buildForecastInput()).breakeven;

    assert.ok(breakeven.breakevenRevenue >= 0);
    assert.ok(breakeven.breakevenUnits >= 0);
    assert.ok(breakeven.fixedCostsMonthly >= 0);
    assert.ok(breakeven.variableCostPerUnit >= 0);
    assert.equal(breakeven.averageOrderValue, 89.99);
    assert.ok(breakeven.monthsToBreakeven >= 0);
  });

  it("models three growth scenarios", () => {
    const scenarios = generateFinancialForecast(buildForecastInput()).growthScenarios;

    assert.equal(scenarios.length, 3);
    for (const scenario of scenarios) {
      assert.ok(SCENARIO_TYPES.includes(scenario.scenarioType));
      assert.ok(scenario.revenueMultiplier > 0);
      assert.ok(scenario.projectedAnnualRevenue >= 0);
      assert.ok(scenario.assumptions.length >= 1);
    }
    assert.ok(scenarios.some((scenario) => scenario.scenarioType === "BASE"));
    assert.ok(scenarios.some((scenario) => scenario.scenarioType === "AGGRESSIVE"));
  });

  it("flags risk scenarios with severity and mitigation", () => {
    const risks = generateFinancialForecast(buildForecastInput()).riskScenarios;

    assert.ok(risks.length >= 2);
    for (const risk of risks) {
      assert.ok(RISK_SEVERITIES.includes(risk.severity));
      assert.ok(risk.revenueImpactPercent >= 0 && risk.revenueImpactPercent <= 100);
      assert.ok(risk.probabilityPercent >= 0 && risk.probabilityPercent <= 100);
      assert.ok(risk.mitigation.length > 0);
    }
  });

  it("computes weighted confidence signals", () => {
    const report = generateFinancialForecast(buildForecastInput());

    assert.ok(report.signals.length >= 7);
    const composite = report.signals.find((signal) => signal.signalType === "forecast_composite");
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates financial forecast report schema", () => {
    const report = generateFinancialForecast(buildForecastInput());
    const validated = validateFinancialForecastReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.revenue.monthlyRevenue >= 0);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoApplyEnabled, false);
    assert.equal(validated.growthScenarios.length, 3);
  });

  it("persists financial forecast records in the repository", async () => {
    const repository = createInMemoryFinancialForecastIntelligenceRepository();
    const module = createFinancialForecastIntelligenceModule(repository);
    const input = buildForecastInput();

    const saved = await module.persistForecast(WORKSPACE_ID, input);
    const loadedByStore = await module.getForecastByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getForecastRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(loadedById!.riskScenarios.length, saved.riskScenarios.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
