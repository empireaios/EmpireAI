import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
} from "../../supplier-framework/index.js";
import {
  createCjDropshippingIntegrationEngine,
  resetCjDropshippingIntegrationForTesting,
} from "../../cj-dropshipping-integration/index.js";
import {
  createAliExpressIntegrationEngine,
  resetAliExpressIntegrationForTesting,
} from "../../aliexpress-integration/index.js";
import {
  createOss1688IntegrationEngine,
  resetOss1688IntegrationForTesting,
} from "../../1688-integration/index.js";
import {
  createSupplierProductSyncEngine,
  resetSupplierProductSyncForTesting,
} from "../../supplier-product-sync/index.js";
import {
  createSupplierInventorySyncEngine,
  resetSupplierInventorySyncForTesting,
} from "../../supplier-inventory-sync/index.js";
import {
  createSupplierPricingEngine,
  resetSupplierPricingEngineForTesting,
} from "../../supplier-pricing-engine/index.js";
import {
  createSupplierRankingEngine,
  resetSupplierRankingEngineForTesting,
  buildSupplierRankingEngineConfiguration,
  SUPPLIER_RANKING_ENGINE_SYSTEM_PATH,
  SRE_METADATA_VERSION,
  SUPPLIER_RANKING_SUPPLIER_IDENTIFIERS,
} from "../../supplier-ranking-engine/index.js";
import { appendSreLog, getSreLogs } from "../../supplier-ranking-engine/sre-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildSupplierRankingEngineConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const sf = createSupplierFrameworkEngine(bootstrap);
  await sf.initialize();
  const cj = createCjDropshippingIntegrationEngine(bootstrap, sf);
  await cj.initialize();
  const aliexpress = createAliExpressIntegrationEngine(bootstrap, sf);
  await aliexpress.initialize();
  const oss1688 = createOss1688IntegrationEngine(bootstrap, sf);
  await oss1688.initialize();
  const productSync = createSupplierProductSyncEngine(bootstrap, cj, aliexpress, oss1688, sf);
  await productSync.initialize();
  await productSync.syncSupplierProducts({ includeFixtureCatalog: true });
  const inventorySync = createSupplierInventorySyncEngine(bootstrap, productSync);
  await inventorySync.initialize();
  await inventorySync.syncSupplierInventory({ includeFixtureInventory: true });
  const pricingEngine = createSupplierPricingEngine(bootstrap, productSync, inventorySync);
  await pricingEngine.initialize();
  await pricingEngine.syncSupplierPricing({ includeFixturePricing: true });
  const engine = createSupplierRankingEngine(bootstrap, productSync, inventorySync, pricingEngine, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, productSync, inventorySync, pricingEngine };
}

describe("R2-08 Supplier Ranking Engine", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
    resetCjDropshippingIntegrationForTesting();
    resetAliExpressIntegrationForTesting();
    resetOss1688IntegrationForTesting();
    resetSupplierProductSyncForTesting();
    resetSupplierInventorySyncForTesting();
    resetSupplierPricingEngineForTesting();
    resetSupplierRankingEngineForTesting();
  });

  test("buildSupplierRankingEngineConfiguration loads defaults", () => {
    const config = buildSupplierRankingEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.scoringRulesEnabled, true);
    assert.equal(config.highPerformerThreshold, 80);
    assert.equal(config.qualityWeight, 0.25);
  });

  test("supplier ranking engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SRE-001");
    assert.equal(state.missionId, "R2-08");
    assert.ok(SUPPLIER_RANKING_ENGINE_SYSTEM_PATH.includes("SUPPLIER_RANKING"));
  });

  test("rankSuppliers calculates rankings for all supported suppliers", async () => {
    const { engine } = await buildEngine();
    const report = engine.rankSuppliers({ includeFixtureMetrics: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.rankings.length, 3);
  });

  test("rankSuppliers produces machine-readable sre-* ranking records", async () => {
    const { engine } = await buildEngine();
    const report = engine.rankSuppliers({ supplierId: "cj-dropshipping" });
    const record = report.rankings[0]!;
    assert.ok(record.rankingRecordId.startsWith("sre-cj-dropshipping"));
    assert.ok(report.rankingReportId.startsWith("sre-run-"));
    assert.equal(record.metadataVersion, SRE_METADATA_VERSION);
    assert.equal(record.supplierId, "cj-dropshipping");
  });

  test("supplier quality scores are generated from upstream metrics", async () => {
    const { engine } = await buildEngine();
    const report = engine.rankSuppliers({ includeFixtureMetrics: false });
    const record = report.rankings.find((r) => r.supplierId === "aliexpress")!;
    assert.ok(record.qualityScore >= 0 && record.qualityScore <= 100);
    assert.ok(record.pricingScore >= 0 && record.pricingScore <= 100);
    assert.ok(record.inventoryReliabilityScore >= 0 && record.inventoryReliabilityScore <= 100);
    assert.ok(record.fulfilmentReliabilityScore >= 0 && record.fulfilmentReliabilityScore <= 100);
    assert.ok(record.responsivenessScore >= 0 && record.responsivenessScore <= 100);
  });

  test("suppliers are ranked by overall score with positions assigned", async () => {
    const { engine } = await buildEngine();
    const report = engine.rankSuppliers({ includeFixtureMetrics: true });
    const positions = report.rankings.map((r) => r.rankingPosition).sort((a, b) => a - b);
    assert.deepEqual(positions, [1, 2, 3]);
    const sorted = [...report.rankings].sort(
      (a, b) => b.overallSupplierScore - a.overallSupplierScore,
    );
    assert.equal(sorted[0]!.rankingPosition, 1);
  });

  test("high-performing suppliers are identified", async () => {
    const { engine } = await buildEngine();
    engine.rankSuppliers({ includeFixtureMetrics: true });
    const report = engine.rankSuppliers({
      includeFixtureMetrics: false,
      performanceFixtureMode: "high_performing",
    });
    assert.ok(report.findings.some((f) => f.findingType === "high_performing"));
  });

  test("declining supplier performance is detected", async () => {
    const { engine } = await buildEngine();
    engine.rankSuppliers({ includeFixtureMetrics: true });
    const report = engine.rankSuppliers({
      includeFixtureMetrics: false,
      performanceFixtureMode: "declining",
    });
    assert.ok(report.findings.some((f) => f.findingType === "declining"));
  });

  test("evaluateSupplier ranks a single supplier", async () => {
    const { engine } = await buildEngine();
    const report = engine.evaluateSupplier({ supplierId: "1688" });
    assert.equal(report.rankings.length, 1);
    assert.equal(report.rankings[0]!.supplierId, "1688");
    assert.equal(report.rankings[0]!.rankingPosition, 1);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSreLog({
      event: "ranking_event",
      level: "info",
      details: "api_key=secret-sre-key bearer abc123 token=xyz",
    });
    engine.rankSuppliers({ supplierId: "cj-dropshipping" });
    const logs = getSreLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-sre-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.rankSuppliers({ includeFixtureMetrics: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.rankingCount, SUPPLIER_RANKING_SUPPLIER_IDENTIFIERS.length);
    assert.ok(cockpit.topSupplierId);
  });

  test("getLatestReport returns most recent ranking operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.rankSuppliers({ supplierId: "aliexpress" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.rankingReportId, report.rankingReportId);
  });
});
