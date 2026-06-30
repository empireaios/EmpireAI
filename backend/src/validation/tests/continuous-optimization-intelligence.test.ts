import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  OPTIMIZATION_DOMAINS,
  OPTIMIZATION_PRIORITIES,
  OPTIMIZATION_TASK_STATUSES,
  createContinuousOptimizationIntelligenceModule,
  createInMemoryContinuousOptimizationIntelligenceRepository,
  generateContinuousOptimization,
  validateContinuousOptimizationReport,
} from "../../execution/continuous-optimization-intelligence/index.js";

const WORKSPACE_ID = "ws-m094";

function buildOptimizationInput(storeId = randomUUID()) {
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
      currentPrice: 89.99,
      currency: "USD",
      monthlyAdSpend: 5200,
      conversionRatePercent: 2.8,
      organicTraffic: 3100,
    },
    storeId,
    optimizationIndex: 79,
  };
}

describe("Mission 094 Continuous Optimization Intelligence Engine", () => {
  it("generates optimization report with safety flags", async () => {
    const module = createContinuousOptimizationIntelligenceModule();
    const record = await module.persistOptimization(WORKSPACE_ID, buildOptimizationInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoApplyEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.overallScore >= 50);
    assert.ok(record.signals.some((signal) => signal.signalType === "optimization_composite"));
  });

  it("generates store optimization tasks with PLANNED status", () => {
    const stores = generateContinuousOptimization(buildOptimizationInput()).stores;

    assert.ok(stores.tasks.length >= 1);
    for (const task of stores.tasks) {
      assert.equal(task.domain, "STORE");
      assert.equal(task.status, "PLANNED");
      assert.ok(OPTIMIZATION_PRIORITIES.includes(task.priority));
      assert.ok(task.action.length > 0);
    }
    assert.ok(stores.summary.length > 0);
  });

  it("generates ads optimization tasks", () => {
    const ads = generateContinuousOptimization(buildOptimizationInput()).ads;

    assert.ok(ads.tasks.length >= 1);
    assert.ok(ads.tasks.every((task) => task.domain === "ADS"));
    assert.ok(ads.tasks.every((task) => task.status === "PLANNED"));
    assert.match(ads.focusArea, /ROAS/i);
  });

  it("generates pricing optimization tasks", () => {
    const pricing = generateContinuousOptimization(buildOptimizationInput()).pricing;

    assert.ok(pricing.tasks.length >= 1);
    assert.ok(pricing.tasks.every((task) => task.domain === "PRICING"));
    assert.ok(pricing.tasks.some((task) => task.title.toLowerCase().includes("pricing") || task.description.includes("89.99")));
  });

  it("generates offer optimization tasks", () => {
    const offers = generateContinuousOptimization(buildOptimizationInput()).offers;

    assert.ok(offers.tasks.length >= 1);
    assert.ok(offers.tasks.every((task) => task.domain === "OFFER"));
    assert.ok(offers.tasks.every((task) => task.expectedImpactPercent >= 0));
  });

  it("generates SEO optimization tasks", () => {
    const seo = generateContinuousOptimization(buildOptimizationInput()).seo;

    assert.ok(seo.tasks.length >= 1);
    assert.ok(seo.tasks.every((task) => task.domain === "SEO"));
    assert.match(seo.focusArea, /Organic/i);
  });

  it("generates marketing optimization tasks", () => {
    const marketing = generateContinuousOptimization(buildOptimizationInput()).marketing;

    assert.ok(marketing.tasks.length >= 1);
    assert.ok(marketing.tasks.every((task) => task.domain === "MARKETING"));
    assert.ok(marketing.tasks.every((task) => task.status === "PLANNED"));
  });

  it("aggregates all tasks across six domains", () => {
    const report = generateContinuousOptimization(buildOptimizationInput());

    assert.ok(report.allTasks.length >= 6);
    assert.equal(report.totalTasks, report.allTasks.length);
    for (const domain of OPTIMIZATION_DOMAINS) {
      assert.ok(report.allTasks.some((task) => task.domain === domain));
    }
    assert.ok(report.allTasks.every((task) => OPTIMIZATION_TASK_STATUSES.includes(task.status)));
  });

  it("sorts tasks by priority and impact", () => {
    const tasks = generateContinuousOptimization(buildOptimizationInput()).allTasks;
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    for (let index = 1; index < tasks.length; index += 1) {
      const previous = tasks[index - 1]!;
      const current = tasks[index]!;
      assert.ok(priorityOrder[previous.priority] <= priorityOrder[current.priority]);
    }
  });

  it("computes weighted confidence signals", () => {
    const report = generateContinuousOptimization(buildOptimizationInput());

    assert.ok(report.signals.length >= 7);
    const composite = report.signals.find(
      (signal) => signal.signalType === "optimization_composite",
    );
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates continuous optimization report schema", () => {
    const report = generateContinuousOptimization(buildOptimizationInput());
    const validated = validateContinuousOptimizationReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.allTasks.length >= 6);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoApplyEnabled, false);
    assert.equal(validated.totalTasks, validated.allTasks.length);
  });

  it("persists continuous optimization records in the repository", async () => {
    const repository = createInMemoryContinuousOptimizationIntelligenceRepository();
    const module = createContinuousOptimizationIntelligenceModule(repository);
    const input = buildOptimizationInput();

    const saved = await module.persistOptimization(WORKSPACE_ID, input);
    const loadedByStore = await module.getOptimizationByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getOptimizationRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(loadedById!.totalTasks, saved.totalTasks);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
