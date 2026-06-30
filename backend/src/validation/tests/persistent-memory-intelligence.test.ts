import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  CAMPAIGN_MEMORY_OUTCOMES,
  FAILURE_SEVERITIES,
  IMPROVEMENT_PRIORITIES,
  PRODUCT_MEMORY_OUTCOMES,
  STORE_HISTORY_EVENT_TYPES,
  SUPPLIER_MEMORY_OUTCOMES,
  createInMemoryPersistentMemoryIntelligenceRepository,
  createPersistentMemoryIntelligenceModule,
  generatePersistentMemory,
  validatePersistentMemoryReport,
} from "../../execution/persistent-memory-intelligence/index.js";

const WORKSPACE_ID = "ws-m093";

function buildMemoryInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 87,
    },
    context: {
      storeName: "Kitchen Blender Supply Store",
      primaryProduct: "Premium Kitchen Blender",
      primarySku: "KBS-BLND-001",
      supplierName: "CJ Dropshipping",
      currency: "USD",
    },
    storeId,
    memoryIndex: 80,
  };
}

describe("Mission 093 Persistent Memory Intelligence Engine", () => {
  it("generates persistent memory with safety flags", async () => {
    const module = createPersistentMemoryIntelligenceModule();
    const record = await module.persistMemory(WORKSPACE_ID, buildMemoryInput());

    assert.ok(record.reportId);
    assert.match(record.memoryName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoWriteEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.overallScore >= 50);
    assert.ok(record.signals.some((signal) => signal.signalType === "memory_composite"));
  });

  it("learns product history with outcomes and lessons", () => {
    const products = generatePersistentMemory(buildMemoryInput()).products;

    assert.ok(products.length >= 1);
    for (const product of products) {
      assert.ok(PRODUCT_MEMORY_OUTCOMES.includes(product.outcome));
      assert.ok(product.lessonsLearned.length >= 1);
      assert.ok(product.revenueGenerated >= 0);
      assert.ok(product.unitsSold >= 0);
    }
    assert.ok(products.some((product) => product.sku === "KBS-BLND-001"));
  });

  it("learns campaign history with ROAS and channel data", () => {
    const campaigns = generatePersistentMemory(buildMemoryInput()).campaigns;

    assert.ok(campaigns.length >= 1);
    for (const campaign of campaigns) {
      assert.ok(CAMPAIGN_MEMORY_OUTCOMES.includes(campaign.outcome));
      assert.ok(campaign.roasAchieved >= 0);
      assert.ok(campaign.channel.length > 0);
      assert.ok(campaign.lessonsLearned.length >= 1);
    }
  });

  it("learns supplier relationships with fulfillment metrics", () => {
    const suppliers = generatePersistentMemory(buildMemoryInput()).suppliers;

    assert.ok(suppliers.length >= 1);
    for (const supplier of suppliers) {
      assert.ok(SUPPLIER_MEMORY_OUTCOMES.includes(supplier.outcome));
      assert.ok(supplier.fulfillmentRatePercent >= 0 && supplier.fulfillmentRatePercent <= 100);
      assert.ok(supplier.averageLeadTimeDays >= 0);
    }
    assert.ok(suppliers.some((supplier) => supplier.supplierName === "CJ Dropshipping"));
  });

  it("learns brand memory with strengths and improvement areas", () => {
    const brands = generatePersistentMemory(buildMemoryInput()).brands;

    assert.ok(brands.length >= 1);
    const brand = brands[0]!;
    assert.match(brand.brandName, /Kitchen Blender Supply Co\./);
    assert.ok(brand.keyStrengths.length >= 1);
    assert.ok(brand.customerSentimentScore >= 0 && brand.customerSentimentScore <= 100);
  });

  it("records failures with root cause and prevention actions", () => {
    const failures = generatePersistentMemory(buildMemoryInput()).failures;

    assert.ok(failures.length >= 1);
    for (const failure of failures) {
      assert.ok(FAILURE_SEVERITIES.includes(failure.severity));
      assert.ok(failure.rootCause.length > 0);
      assert.ok(failure.preventionAction.length > 0);
      assert.ok(failure.occurredAt.length > 0);
    }
  });

  it("records successes with replicable patterns", () => {
    const successes = generatePersistentMemory(buildMemoryInput()).successes;

    assert.ok(successes.length >= 1);
    for (const success of successes) {
      assert.ok(success.keyFactor.length > 0);
      assert.ok(success.replicablePattern.length > 0);
      assert.ok(success.impactScore >= 0 && success.impactScore <= 100);
    }
  });

  it("tracks store history timeline", () => {
    const history = generatePersistentMemory(buildMemoryInput()).storeHistory;

    assert.ok(history.events.length >= 2);
    for (const event of history.events) {
      assert.ok(STORE_HISTORY_EVENT_TYPES.includes(event.eventType));
      assert.ok(event.title.length > 0);
      assert.ok(event.occurredAt.length > 0);
    }
    assert.ok(history.monthsActive >= 0);
    assert.equal(history.currency, "USD");
    assert.ok(history.summary.length > 0);
  });

  it("generates decision improvements from accumulated memory", () => {
    const improvements = generatePersistentMemory(buildMemoryInput()).decisionImprovements;

    assert.ok(improvements.length >= 2);
    for (const improvement of improvements) {
      assert.ok(IMPROVEMENT_PRIORITIES.includes(improvement.priority));
      assert.ok(improvement.recommendation.length > 0);
      assert.ok(improvement.basedOnMemory.length >= 1);
      assert.ok(improvement.expectedImpactPercent >= 0 && improvement.expectedImpactPercent <= 100);
    }
    assert.ok(improvements.some((item) => item.priority === "HIGH"));
  });

  it("computes weighted confidence signals", () => {
    const report = generatePersistentMemory(buildMemoryInput());

    assert.ok(report.signals.length >= 8);
    const composite = report.signals.find((signal) => signal.signalType === "memory_composite");
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates persistent memory report schema", () => {
    const report = generatePersistentMemory(buildMemoryInput());
    const validated = validatePersistentMemoryReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.products.length >= 1);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoWriteEnabled, false);
    assert.ok(validated.decisionImprovements.length >= 1);
  });

  it("persists persistent memory records in the repository", async () => {
    const repository = createInMemoryPersistentMemoryIntelligenceRepository();
    const module = createPersistentMemoryIntelligenceModule(repository);
    const input = buildMemoryInput();

    const saved = await module.persistMemory(WORKSPACE_ID, input);
    const loadedByStore = await module.getMemoryByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getMemoryRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(loadedById!.failures.length, saved.failures.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
