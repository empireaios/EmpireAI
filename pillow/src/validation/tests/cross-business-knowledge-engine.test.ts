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
  buildCrossBusinessKnowledgeEngineConfiguration,
  CROSS_BUSINESS_KNOWLEDGE_ENGINE_SYSTEM_PATH,
  CBK_CAPABILITIES,
  CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID,
} from "../../cross-business-knowledge-engine/index.js";
import {
  appendCbkLog,
  getCbkLogs,
} from "../../cross-business-knowledge-engine/cbk-logging.js";

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
  mcr.registerCompany({
    companyName: "Beta Services",
    companyId: "company-beta",
    ownershipReference: "structural://ownership/beta",
    validated: true,
  });

  const ppe = createPortfolioPerformanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
  });
  await ppe.initialize();

  const engine = createCrossBusinessKnowledgeEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
  });
  await engine.initialize();
  return { engine, epf, mcr, ppe };
}

describe("X2-04 Cross-Business Knowledge Engine", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
  });

  test("buildCrossBusinessKnowledgeEngineConfiguration loads defaults", () => {
    const config = buildCrossBusinessKnowledgeEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverShareConfidentialWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.ok(CBK_CAPABILITIES.includes("operational_knowledge_collection"));
  });

  test("cross-business knowledge engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CBK-001");
    assert.equal(state.missionId, "X2-04");
    assert.ok(CROSS_BUSINESS_KNOWLEDGE_ENGINE_SYSTEM_PATH.includes("CROSS_BUSINESS"));
  });

  test("connectCrossBusinessKnowledgeEngine registers with EPF via X2-04", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectCrossBusinessKnowledgeEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.multiCompanyRegistry, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioPerformanceEngine, true);
  });

  test("collectKnowledge produces machine-readable cbk-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossBusinessKnowledgeEngine();
    const report = engine.collectKnowledge({
      sourceCompany: "company-alpha",
      knowledgeCategory: "successful_practice",
      knowledgeSummary: "Structural checkout funnel simplification improved conversion signals",
      reusabilityScore: 78,
      confidenceScore: 72,
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.knowledgeRunReportId.startsWith("cbk-run-"));
    const record = report.knowledgeRecords[0]!;
    assert.ok(record.knowledgeRecordId.startsWith("cbk-"));
    assert.equal(record.metadataVersion, "CBK-001-v1");
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.confidentialContent, false);
  });

  test("rejects duplicate knowledge without allowDuplicate", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossBusinessKnowledgeEngine();
    const payload = {
      sourceCompany: "company-alpha",
      knowledgeCategory: "operational_practice" as const,
      knowledgeSummary: "Weekly inventory reconciliation cadence",
      validated: true,
    };
    engine.collectKnowledge(payload);
    const duplicate = engine.collectKnowledge(payload);
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("classify share and rank knowledge lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossBusinessKnowledgeEngine();
    const collected = engine.collectKnowledge({
      sourceCompany: "company-alpha",
      knowledgeCategory: "general",
      knowledgeSummary: "Supplier lead-time buffer heuristic",
      reusabilityScore: 70,
      confidenceScore: 65,
      validated: true,
    });
    const knowledgeRecordId = collected.knowledgeRecords[0]!.knowledgeRecordId;

    const classified = engine.classifyKnowledge({
      knowledgeRecordId,
      knowledgeCategory: "operational_practice",
      validated: true,
    });
    assert.equal(classified.knowledgeRecords[0]?.knowledgeCategory, "operational_practice");

    const shared = engine.shareKnowledge({
      knowledgeRecordId,
      targetCompanies: ["company-beta"],
      validated: true,
    });
    assert.equal(shared.knowledgeRecords[0]?.distributionStatus, "shared");
    assert.ok(shared.knowledgeRecords[0]?.sharedWith.includes("company-beta"));

    const ranked = engine.rankKnowledge({ validated: true });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.knowledgeRecords.every((r) => r.ranking !== null));
  });

  test("generateRecommendations produces structural recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossBusinessKnowledgeEngine();
    engine.collectKnowledge({
      sourceCompany: "company-alpha",
      knowledgeCategory: "successful_practice",
      knowledgeSummary: "Launch cohort retention playbook",
      reusabilityScore: 80,
      confidenceScore: 75,
      validated: true,
    });
    const report = engine.generateRecommendations({ targetCompany: "company-beta" });
    assert.equal(report.action, "recommend");
    assert.ok(report.recommendations.length > 0);
    assert.ok(report.recommendations.every((r) => r.structuralSignalOnly === true));
  });

  test("rejects unvalidated collection and confidential summaries", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossBusinessKnowledgeEngine();
    const unvalidated = engine.collectKnowledge({
      sourceCompany: "company-alpha",
      knowledgeSummary: "Some practice",
      validated: false,
    });
    assert.equal(unvalidated.validation.decision, "fail");

    const confidential = engine.collectKnowledge({
      sourceCompany: "company-alpha",
      knowledgeSummary: "Contains confidential api_key material",
      validated: true,
    });
    assert.equal(confidential.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCbkLog({
      event: "knowledge_collection",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectCrossBusinessKnowledgeEngine();
    const logs = getCbkLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossBusinessKnowledgeEngine();
    engine.collectKnowledge({
      sourceCompany: "company-alpha",
      knowledgeSummary: "Cross-company fulfillment buffer guidance",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.totalKnowledgeRecords, 1);
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.dependenciesConnected, 3);
  });
});
