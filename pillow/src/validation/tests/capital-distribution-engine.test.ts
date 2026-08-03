import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createEnterprisePortfolioFrameworkEngine,
  resetEnterprisePortfolioFrameworkForTesting,
} from "../../enterprise-portfolio-framework/index.js";
import {
  createMultiCompanyRegistry,
  resetMultiCompanyRegistryForTesting,
} from "../../multi-company-registry/index.js";
import {
  createPortfolioPerformanceEngine,
  resetPortfolioPerformanceEngineForTesting,
} from "../../portfolio-performance-engine/index.js";
import {
  createCrossBusinessKnowledgeEngine,
  resetCrossBusinessKnowledgeEngineForTesting,
} from "../../cross-business-knowledge-engine/index.js";
import {
  createCapitalDistributionEngine,
  resetCapitalDistributionEngineForTesting,
  buildCapitalDistributionEngineConfiguration,
  CAPITAL_DISTRIBUTION_ENGINE_SYSTEM_PATH,
  CDE_CAPABILITIES,
  CAPITAL_DISTRIBUTION_ENGINE_ID,
} from "../../capital-distribution-engine/index.js";
import {
  appendCdeLog,
  getCdeLogs,
} from "../../capital-distribution-engine/cde-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const epf = createEnterprisePortfolioFrameworkEngine(bootstrap);
  await epf.initialize();
  const mcr = createMultiCompanyRegistry(bootstrap, {
    enterprisePortfolioFramework: epf,
  });
  await mcr.initialize();
  mcr.connectMultiCompanyRegistry();
  mcr.registerCompany({
    companyName: "Alpha Commerce Co",
    companyId: "company-alpha",
    ownershipReference: "structural://ownership/alpha",
    validated: true,
  });

  const ppe = createPortfolioPerformanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
  });
  await ppe.initialize();
  ppe.connectPortfolioPerformanceEngine();
  ppe.measureCompanyPerformance({
    companyReference: "company-alpha",
    metrics: {
      revenueIndex: 75,
      profitabilityIndex: 70,
      operationalEfficiencyIndex: 68,
      customerPerformanceIndex: 66,
      growthIndex: 72,
    },
    validated: true,
  });

  const cbk = createCrossBusinessKnowledgeEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
  });
  await cbk.initialize();

  const engine = createCapitalDistributionEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
  });
  await engine.initialize();
  return { engine, epf };
}

describe("X2-05 Capital Distribution Engine", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCapitalDistributionEngineForTesting();
  });

  test("buildCapitalDistributionEngineConfiguration loads defaults", () => {
    const config = buildCapitalDistributionEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverAllocateBeyondApprovalPolicy, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.ok(CDE_CAPABILITIES.includes("expected_roi_calculation"));
  });

  test("capital distribution engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CDE-001");
    assert.equal(state.missionId, "X2-05");
    assert.ok(CAPITAL_DISTRIBUTION_ENGINE_SYSTEM_PATH.includes("CAPITAL_DISTRIBUTION"));
  });

  test("connectCapitalDistributionEngine registers with EPF via X2-05", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectCapitalDistributionEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === CAPITAL_DISTRIBUTION_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.multiCompanyRegistry, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioPerformanceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.crossBusinessKnowledgeEngine, true);
  });

  test("allocateCapital produces machine-readable cde-* records with ROI", async () => {
    const { engine } = await buildEngine();
    engine.connectCapitalDistributionEngine();
    const report = engine.allocateCapital({
      companyReference: "company-alpha",
      investmentOpportunityReference: "structural://opportunity/alpha-growth",
      requestedCapital: 80,
      expectedRoiHint: 28,
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.capitalRunReportId.startsWith("cde-run-"));
    const record = report.allocationRecords[0]!;
    assert.ok(record.capitalAllocationId.startsWith("cde-"));
    assert.equal(record.metadataVersion, "CDE-001-v1");
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.sensitiveFinancialData, false);
    assert.ok(record.expectedRoi > 0);
    assert.ok(record.approvedAllocation <= 80);
  });

  test("never allocates beyond approval policy without manual review", async () => {
    const { engine } = await buildEngine();
    engine.connectCapitalDistributionEngine();
    const report = engine.allocateCapital({
      companyReference: "company-alpha",
      investmentOpportunityReference: "structural://opportunity/alpha-scale",
      requestedCapital: 500,
      expectedRoiHint: 40,
      validated: true,
    });
    const record = report.allocationRecords[0]!;
    assert.ok(record.approvedAllocation <= 100);
    assert.equal(record.requiresManualApproval, true);
    assert.equal(record.autoApproved, false);
  });

  test("evaluateFunding rankPriorities and risk analysis", async () => {
    const { engine } = await buildEngine();
    engine.connectCapitalDistributionEngine();
    engine.allocateCapital({
      companyReference: "company-alpha",
      investmentOpportunityReference: "structural://opportunity/alpha-a",
      requestedCapital: 50,
      expectedRoiHint: 30,
      validated: true,
    });
    engine.allocateCapital({
      companyReference: "company-alpha",
      investmentOpportunityReference: "structural://opportunity/alpha-b",
      requestedCapital: 60,
      expectedRoiHint: 18,
      validated: true,
    });

    const funding = engine.evaluateFunding({
      companyReference: "company-alpha",
      requestedCapital: 40,
      expectedRoiHint: 22,
      validated: true,
    });
    assert.equal(funding.action, "evaluate_funding");
    assert.ok(funding.allocationRecords[0]!.expectedRoi > 0);

    const ranked = engine.rankCapitalPriorities({ validated: true });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.allocationRecords.every((r) => r.ranking !== null));

    const risks = engine.analyzeCapitalRisk({ validated: true });
    assert.equal(risks.action, "analyze_risk");
  });

  test("generateRecommendations produces structural recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectCapitalDistributionEngine();
    engine.allocateCapital({
      companyReference: "company-alpha",
      investmentOpportunityReference: "structural://opportunity/alpha-c",
      requestedCapital: 70,
      expectedRoiHint: 32,
      validated: true,
    });
    engine.analyzeCapitalRisk({ validated: true });
    const report = engine.generateRecommendations();
    assert.equal(report.action, "recommend");
    assert.ok(report.recommendations.length > 0);
    assert.ok(report.recommendations.every((r) => r.structuralSignalOnly === true));
  });

  test("rejects unvalidated capital requests", async () => {
    const { engine } = await buildEngine();
    engine.connectCapitalDistributionEngine();
    const report = engine.allocateCapital({
      companyReference: "company-alpha",
      investmentOpportunityReference: "structural://opportunity/alpha-d",
      requestedCapital: 40,
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCdeLog({
      event: "capital_request",
      level: "info",
      details: "api_key=secret-key bank_account=123456",
    });
    engine.connectCapitalDistributionEngine();
    const logs = getCdeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCapitalDistributionEngine();
    engine.allocateCapital({
      companyReference: "company-alpha",
      investmentOpportunityReference: "structural://opportunity/alpha-e",
      requestedCapital: 45,
      expectedRoiHint: 24,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.totalAllocationRecords >= 1);
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.dependenciesConnected, 4);
  });
});
