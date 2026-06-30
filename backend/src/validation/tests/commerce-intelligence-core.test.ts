import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { configureValidationEnvironment } from "../harness.js";
import { buildCommercePillowContext } from "../../intelligence/commerce-intelligence-core/services/commerce-pillow-context-service.js";
import { generateCreativePackage } from "../../intelligence/commerce-intelligence-core/services/creative-service.js";
import { applyCeoLens, applyCtoLens } from "../../intelligence/commerce-intelligence-core/services/executive-lens-service.js";
import { analyzeArbitrage } from "../../intelligence/commerce-intelligence-core/services/arbitrage-service.js";
import { studyAmazonMarketplace } from "../../intelligence/commerce-intelligence-core/services/marketplace-study-service.js";
import { normalizeCjProduct } from "../../intelligence/commerce-intelligence-core/services/normalization-service.js";
import { evaluateProductFit } from "../../intelligence/commerce-intelligence-core/services/product-fit-service.js";
import { analyzeSupplierIntelligence } from "../../intelligence/commerce-intelligence-core/services/supplier-intelligence-service.js";
import {
  decideMission,
  getCommerceIntelligenceDashboard,
  MissionNotReadyError,
  runCommerceIntelligencePipeline,
} from "../../intelligence/commerce-intelligence-core/services/pipeline-service.js";
import { executeApprovedLaunch, LaunchAutomationBlockedError } from "../../intelligence/commerce-intelligence-core/services/launch-automation-service.js";
import { monitorMissionPerformance } from "../../intelligence/commerce-intelligence-core/services/performance-monitoring-service.js";
import { getCjSandboxProducts } from "../../suppliers/cj-dropshipping/cj-sandbox-fixtures.js";
import { resetCommerceIntelligenceStore } from "../../intelligence/commerce-intelligence-core/store/commerce-intelligence-store.js";

const WORKSPACE = "ws_pillow_020";
const COMPANY = "co-grand-king";

describe("PILLOW-020 Commerce Intelligence Operating System", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetCommerceIntelligenceStore(WORKSPACE);
  });

  afterEach(() => {
    resetCommerceIntelligenceStore(WORKSPACE);
  });

  it("PILLOW-020 — supplier pull creates normalized candidates", () => {
    const product = getCjSandboxProducts()[0]!;
    const candidate = normalizeCjProduct(WORKSPACE, COMPANY, product);
    assert.ok(candidate.candidateId);
    assert.equal(candidate.supplierId, "cj-dropshipping");
    assert.ok(candidate.title.length > 0);
    assert.ok(candidate.variants.length > 0);
    assert.equal(typeof candidate.fulfilmentReadiness, "boolean");
    assert.ok(!JSON.stringify(candidate).includes("productNameEn"));
  });

  it("PILLOW-020 — supplier intelligence scores viability", () => {
    const product = getCjSandboxProducts()[0]!;
    const candidate = normalizeCjProduct(WORKSPACE, COMPANY, product);
    const supplier = analyzeSupplierIntelligence(candidate);
    assert.ok(supplier.viabilityScore >= 0);
    assert.ok(["low", "medium", "high"].includes(supplier.supplyRisk));
    assert.equal(typeof supplier.fulfilmentReadiness, "boolean");
  });

  it("PILLOW-020 — marketplace analysis scores Amazon US fit", () => {
    const product = getCjSandboxProducts()[0]!;
    const candidate = normalizeCjProduct(WORKSPACE, COMPANY, product);
    const study = studyAmazonMarketplace(candidate);
    assert.equal(study.marketplaceId, "amazon-us");
    assert.ok(study.marketplaceFitScore >= 0);
    assert.ok(study.restrictionRisk);
  });

  it("PILLOW-020 — arbitrage analysis calculates margin", () => {
    const product = getCjSandboxProducts()[0]!;
    const candidate = normalizeCjProduct(WORKSPACE, COMPANY, product);
    const study = studyAmazonMarketplace(candidate);
    const arbitrage = analyzeArbitrage(candidate, study);
    assert.ok(arbitrage.arbitrageScore >= 0);
    assert.ok(arbitrage.launchBudgetEstimateUsd > 0);
    assert.equal(typeof arbitrage.passesThreshold, "boolean");
  });

  it("PILLOW-020 — creative package is generated", () => {
    const product = getCjSandboxProducts()[0]!;
    const candidate = normalizeCjProduct(WORKSPACE, COMPANY, product);
    const study = studyAmazonMarketplace(candidate);
    const arbitrage = analyzeArbitrage(candidate, study);
    const fit = evaluateProductFit(candidate, arbitrage);
    const creative = generateCreativePackage(candidate, study, fit);
    assert.ok(creative.title);
    assert.ok(creative.bulletPoints.length >= 3);
    assert.ok(creative.positioningAngle);
    assert.ok(creative.mediaGenerationTasks.length > 0);
  });

  it("PILLOW-020 — CEO/CTO lenses gate proposals", () => {
    const product = getCjSandboxProducts()[0]!;
    const candidate = normalizeCjProduct(WORKSPACE, COMPANY, product);
    const study = studyAmazonMarketplace(candidate);
    const arbitrage = analyzeArbitrage(candidate, study);
    const fit = evaluateProductFit(candidate, arbitrage);
    const ceo = applyCeoLens(candidate, study, arbitrage, fit);
    const cto = applyCtoLens(candidate, study, fit);
    assert.equal(typeof ceo.passes, "boolean");
    assert.equal(typeof cto.passes, "boolean");
    assert.equal(typeof cto.monitoringReady, "boolean");
  });

  it("PILLOW-020 — pipeline creates Product Launch Missions under Pillow", async () => {
    const result = await runCommerceIntelligencePipeline(WORKSPACE, COMPANY);
    assert.ok(result.pulled >= 2);
    assert.ok(result.missionsCreated >= 1);

    const dashboard = getCommerceIntelligenceDashboard(WORKSPACE, COMPANY);
    assert.equal(dashboard.missionId, "PILLOW-020");
    assert.equal(dashboard.intelligenceOwner, "pillow");
  });

  it("PILLOW-020 — Grand King approval required before launch", async () => {
    const result = await runCommerceIntelligencePipeline(WORKSPACE, COMPANY);
    const ready = result.queue.find((q) => q.status === "mission_ready");
    assert.ok(ready?.missionId);

    assert.throws(
      () => executeApprovedLaunch(WORKSPACE, ready.missionId!, "test@empire.ai"),
      LaunchAutomationBlockedError,
    );
  });

  it("PILLOW-020 — rejected/deferred NOT READY products do not launch on approve", async () => {
    const result = await runCommerceIntelligencePipeline(WORKSPACE, COMPANY);
    const notReady = result.queue.find((q) => q.status === "not_ready");
    if (notReady?.missionId) {
      assert.throws(
        () => decideMission(WORKSPACE, notReady.missionId!, "approve", "grand-king@empire.ai"),
        MissionNotReadyError,
      );
    }
  });

  it("PILLOW-020 — approved mission executes approval-gated launch and monitoring", async () => {
    const result = await runCommerceIntelligencePipeline(WORKSPACE, COMPANY);
    const ready = result.queue.find((q) => q.status === "mission_ready");
    assert.ok(ready?.missionId);

    const approved = decideMission(WORKSPACE, ready.missionId!, "approve", "grand-king@empire.ai");
    if ("decisionKind" in approved) assert.fail("Expected approve");
    assert.equal(approved.status, "approved");

    const launched = executeApprovedLaunch(WORKSPACE, ready.missionId!, "grand-king@empire.ai");
    assert.ok(launched.gkrProductId);
    assert.equal(launched.status, "monitoring");

    const monitored = monitorMissionPerformance(WORKSPACE, ready.missionId!);
    assert.ok(monitored.snapshot.sales >= 0);
    assert.ok(monitored.followUps.length > 0);
    assert.equal(monitored.followUps[0]?.approvalRequired, true);
  });

  it("PILLOW-020 — Pillow companion receives commerce context", async () => {
    await runCommerceIntelligencePipeline(WORKSPACE, COMPANY);
    const context = buildCommercePillowContext(WORKSPACE);
    assert.equal(context.intelligenceOwner, "pillow");
    assert.equal(context.program, "PILLOW-020");
    assert.ok(context.currentCandidate || context.currentMission);
    if (context.currentMission) {
      assert.ok(context.currentMission.whyEvidence.length > 0);
    }
  });
});
