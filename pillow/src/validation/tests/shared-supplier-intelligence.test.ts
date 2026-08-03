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
  createCrossCompanyResourceEngine,
  resetCrossCompanyResourceEngineForTesting,
} from "../../cross-company-resource-engine/index.js";
import {
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
} from "../../supplier-framework/index.js";
import {
  createSharedSupplierIntelligence,
  resetSharedSupplierIntelligenceForTesting,
  buildSharedSupplierIntelligenceConfiguration,
  SHARED_SUPPLIER_INTELLIGENCE_SYSTEM_PATH,
  SSI_CAPABILITIES,
  SHARED_SUPPLIER_INTELLIGENCE_ID,
} from "../../shared-supplier-intelligence/index.js";
import { appendSsiLog, getSsiLogs } from "../../shared-supplier-intelligence/ssi-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildSharedSupplierIntelligenceConfiguration>[1],
) {
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
    companyName: "Beta Services Co",
    companyId: "company-beta",
    ownershipReference: "structural://ownership/beta",
    companyCategory: "services",
    validated: true,
  });

  const ppe = createPortfolioPerformanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
  });
  await ppe.initialize();

  const cbk = createCrossBusinessKnowledgeEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
  });
  await cbk.initialize();

  const ccre = createCrossCompanyResourceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: null,
    portfolioIntelligenceCertified: null,
  });
  await ccre.initialize();

  const supplierFramework = createSupplierFrameworkEngine(bootstrap);
  await supplierFramework.initialize();

  const engine = createSharedSupplierIntelligence(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: mcr,
      crossBusinessKnowledgeEngine: cbk,
      crossCompanyResourceEngine: ccre,
      supplierFramework,
      supplierOperationsCertification: null,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-13 Shared Supplier Intelligence", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCrossCompanyResourceEngineForTesting();
    resetSupplierFrameworkForTesting();
    resetSharedSupplierIntelligenceForTesting();
  });

  test("buildSharedSupplierIntelligenceConfiguration locks agreement safety flags", () => {
    const config = buildSharedSupplierIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeConfidentialSupplierAgreements, true);
    assert.equal(config.neverLogSensitiveSupplierInformation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.ok(SSI_CAPABILITIES.includes("supplier_knowledge_consolidation"));
    assert.ok(SSI_CAPABILITIES.includes("optimal_supplier_recommendations"));
  });

  test("shared supplier intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SSI-001");
    assert.equal(state.missionId, "X2-13");
    assert.ok(SHARED_SUPPLIER_INTELLIGENCE_SYSTEM_PATH.includes("SHARED_SUPPLIER_INTELLIGENCE"));
  });

  test("connectSharedSupplierIntelligence registers with EPF via X2-13", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectSharedSupplierIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === SHARED_SUPPLIER_INTELLIGENCE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.crossCompanyResourceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.supplierFramework, true);
  });

  test("consolidate and track produce machine-readable ssi-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedSupplierIntelligence();

    const consolidated = engine.consolidateSupplierKnowledge({
      supplierReference: "supplier-alpha-1",
      companyReferences: ["company-alpha"],
      performanceScore: 78,
      reliabilityScore: 82,
      costCompetitivenessScore: 70,
      validated: true,
    });
    assert.notEqual(
      consolidated.validation.decision,
      "fail",
      consolidated.validation.errors.join("; "),
    );
    assert.ok(consolidated.supplierIntelligenceRunReportId.startsWith("ssi-run-"));
    const record = consolidated.intelligenceRecords[0]!;
    assert.ok(record.supplierIntelligenceId.startsWith("ssi-si-"));
    assert.equal(record.metadataVersion, "SSI-001-v1");
    assert.equal(record.agreementSafe, true);
    assert.equal(record.sensitiveSupplierData, false);
    assert.equal(record.structuralSignalOnly, true);

    const tracked = engine.trackSupplierPerformance({
      supplierReference: "supplier-alpha-1",
      performanceScore: 85,
      reliabilityScore: 88,
      costCompetitivenessScore: 74,
      validated: true,
    });
    assert.notEqual(tracked.validation.decision, "fail");
    assert.equal(tracked.intelligenceRecords[0]!.supplierPerformanceScore, 85);
    assert.equal(tracked.intelligenceRecords[0]!.reliabilityScore, 88);
  });

  test("detects risks duplicates recommends and shares supplier intelligence", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedSupplierIntelligence();
    engine.consolidateSupplierKnowledge({
      supplierReference: "supplier-optimal",
      companyReferences: ["company-alpha"],
      performanceScore: 90,
      reliabilityScore: 88,
      costCompetitivenessScore: 80,
      validated: true,
    });
    engine.consolidateSupplierKnowledge({
      supplierReference: "supplier_risk",
      companyReferences: ["company-alpha"],
      performanceScore: 40,
      reliabilityScore: 20,
      costCompetitivenessScore: 25,
      validated: true,
    });
    engine.consolidateSupplierKnowledge({
      supplierReference: "supplier-risk",
      companyReferences: ["company-beta"],
      performanceScore: 42,
      reliabilityScore: 22,
      costCompetitivenessScore: 28,
      validated: true,
    });

    const risks = engine.detectSupplierRisks({ validated: true });
    assert.ok(risks.riskSignals.some((r) => r.riskType === "reliability"));

    const duplicates = engine.detectSupplierDuplicates({ validated: true });
    assert.ok(duplicates.riskSignals.some((r) => r.riskType === "duplication"));

    const recommended = engine.generateRecommendations();
    assert.ok(recommended.recommendations.length >= 1);
    assert.ok(
      recommended.recommendations.some(
        (r) =>
          r.recommendationType === "prefer" ||
          r.recommendationType === "share" ||
          r.recommendationType === "mitigate_risk" ||
          r.recommendationType === "manual_review",
      ),
    );

    const shared = engine.shareSupplierIntelligence({
      supplierReference: "supplier-optimal",
      targetCompanies: ["company-beta"],
      validated: true,
    });
    assert.notEqual(shared.validation.decision, "fail", shared.validation.errors.join("; "));
    assert.equal(shared.intelligenceRecords[0]!.sharedAcrossCompanies, true);
    assert.ok(shared.intelligenceRecords[0]!.associatedCompanies.includes("company-beta"));
  });

  test("rejects unvalidated supplier knowledge consolidation", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedSupplierIntelligence();
    const report = engine.consolidateSupplierKnowledge({
      supplierReference: "supplier-unvalidated",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive supplier values in logs", async () => {
    const { engine } = await buildEngine();
    appendSsiLog({
      event: "supplier_synchronization",
      level: "info",
      details: "agreement=confidential-terms api_key=secret-key",
    });
    engine.connectSharedSupplierIntelligence();
    const logs = getSsiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("confidential-terms")));
  });

  test("never disables agreement, credential, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeConfidentialSupplierAgreements: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveSupplierInformation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeConfidentialSupplierAgreements, true);
    assert.equal(config.neverLogSensitiveSupplierInformation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverExposeCredentials, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report intelligence health", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedSupplierIntelligence();
    engine.consolidateSupplierKnowledge({
      supplierReference: "supplier-cockpit-1",
      companyReferences: ["company-alpha", "company-beta"],
      performanceScore: 75,
      reliabilityScore: 70,
      costCompetitivenessScore: 68,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalIntelligenceRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });

  test("diagnostics report supplier intelligence status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedSupplierIntelligence();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(report.engineRecord.healthStatus === "healthy" || report.engineRecord.healthStatus === "degraded" || report.engineRecord.healthStatus === "standby" || report.engineRecord.healthStatus === "failed");
  });
});
