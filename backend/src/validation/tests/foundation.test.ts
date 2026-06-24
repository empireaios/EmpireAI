import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configureValidationEnvironment } from "../harness.js";
import {
  bootstrapFoundation,
  intelligenceFoundation,
  royaltyFramework,
  withdrawalRulesFramework,
  workforceIntelligenceQuery,
} from "../../foundation/index.js";
import { financialLedger } from "../../finance/ledger.js";
import { architectureValidator } from "../../guardian/architecture-validator.js";
import { productIntelligenceEngine } from "../../intelligence/pie-engine.js";
import { buildSamplePieInput, PIE_SAMPLE_PRODUCTS } from "../../intelligence/pie-samples.js";
import { supplierIntelligenceFramework } from "../../intelligence/supplier-intelligence.js";
import { CONNECTOR_CATALOG } from "../../connectors/catalog.js";
import { listConnectorMetadata } from "../../connectors/metadata.js";
import { defaultConnectorRegistry } from "../../connectors/registry.js";
import { workforceRegistry } from "../../workforce/registry.js";

configureValidationEnvironment();

describe("Mission 002 Intelligence Foundation", () => {
  it("bootstraps foundation idempotently", () => {
    bootstrapFoundation("ws_foundation_test");
    bootstrapFoundation("ws_foundation_test");
    const summary = financialLedger.summarize("ws_foundation_test");
    assert.ok(summary.eventCount >= 4);
  });

  it("validates architecture checks including Mission 002 modules", () => {
    const report = architectureValidator.validate("ws_foundation_test");
    assert.ok(["healthy", "degraded"].includes(report.overall));
    assert.ok(report.checks.length >= 12);
    const checkIds = report.checks.map((c) => c.id);
    assert.ok(checkIds.includes("connector-metadata"));
    assert.ok(checkIds.includes("supplier-intelligence"));
    assert.ok(checkIds.includes("royalty-framework"));
    assert.ok(checkIds.includes("withdrawal-rules"));
    assert.ok(checkIds.includes("workforce-intelligence-query"));
  });

  it("PIE produces explainable scores with Mission 002 dimensions", () => {
    const score = productIntelligenceEngine.score(buildSamplePieInput("ws_foundation_test", 0));
    assert.ok(score.why.length >= 1);
    assert.ok(score.compositeScore >= 0);
    assert.ok(score.confidence >= 0);
    const dimensions = score.dimensions.map((d) => d.dimension);
    assert.ok(dimensions.includes("margin"));
    assert.ok(dimensions.includes("supplierReliability"));
    assert.ok(dimensions.includes("adDifficulty"));
  });

  it("supplier intelligence scores mock catalog", () => {
    const catalog = supplierIntelligenceFramework.listCatalog();
    assert.ok(catalog.length >= 3);
    const score = supplierIntelligenceFramework.score({
      workspaceId: "ws_foundation_test",
      supplierId: catalog[0]!.id,
    });
    assert.ok(score.why.length >= 1);
    assert.ok(score.costProfile.estimatedMonthlyCostCents > 0);
  });

  it("connector metadata registry covers catalog", () => {
    assert.ok(CONNECTOR_CATALOG.length >= 15);
    assert.ok(listConnectorMetadata().length >= CONNECTOR_CATALOG.length);
    const meta = defaultConnectorRegistry.getMetadata("stripe");
    assert.ok(meta?.apiKeyRequired === true);
    assert.ok(meta?.fallbackProviderId === "paypal");
  });

  it("royalty framework calculates 10% net profit", () => {
    const calc = royaltyFramework.calculate("ws_foundation_test");
    assert.equal(calc.royaltyRate, 0.1);
    assert.ok(calc.royaltyCents >= 0);
  });

  it("withdrawal rules block invalid requests", () => {
    const validation = withdrawalRulesFramework.validate("ws_foundation_test", -100);
    assert.equal(validation.allowed, false);
    assert.ok(validation.violations.some((v) => v.ruleId === "positive-amount"));
  });

  it("workforce intelligence query enforces role capabilities", () => {
    assert.ok(workforceRegistry.list().length >= 10);
    const allowed = workforceIntelligenceQuery.query({
      roleId: "ai-product-intelligence",
      queryType: "pie.samples",
      workspaceId: "ws_foundation_test",
      payload: { sampleIndex: 0 },
    });
    assert.equal(allowed.allowed, true);
    assert.ok(allowed.data);

    const denied = workforceIntelligenceQuery.query({
      roleId: "ai-customer-success",
      queryType: "connector.metadata",
      workspaceId: "ws_foundation_test",
    });
    assert.equal(denied.allowed, false);
  });

  it("intelligence foundation snapshot reflects seeded data", () => {
    const snap = intelligenceFoundation.snapshot("ws_foundation_test");
    assert.equal(snap.pieSamples, PIE_SAMPLE_PRODUCTS.length);
    assert.ok(snap.pieEvaluations >= 5);
    assert.ok(snap.scoutProducts >= 5);
    assert.ok(snap.scoutEvaluations >= 5);
    assert.ok(snap.suppliers >= 3);
    assert.ok(snap.connectors.metadata >= 15);
  });
});
