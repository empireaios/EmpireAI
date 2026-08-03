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
} from "../../capital-distribution-engine/index.js";
import {
  createExecutivePortfolioDashboard,
  resetExecutivePortfolioDashboardForTesting,
} from "../../executive-portfolio-dashboard/index.js";
import {
  createPortfolioRiskEngine,
  resetPortfolioRiskEngineForTesting,
} from "../../portfolio-risk-engine/index.js";
import {
  createPortfolioBalanceEngine,
  resetPortfolioBalanceEngineForTesting,
} from "../../portfolio-balance-engine/index.js";
import {
  createBusinessHealthRanking,
  resetBusinessHealthRankingForTesting,
} from "../../business-health-ranking/index.js";
import {
  createPortfolioIntelligenceCertified,
  resetPortfolioIntelligenceCertifiedForTesting,
  buildPortfolioIntelligenceCertifiedConfiguration,
  PORTFOLIO_INTELLIGENCE_CERTIFIED_SYSTEM_PATH,
  PIC_CAPABILITIES,
  PORTFOLIO_INTELLIGENCE_CERTIFIED_ID,
  CERTIFIED_MODULE_IDS,
} from "../../portfolio-intelligence-certified/index.js";
import { appendPicLog, getPicLogs } from "../../portfolio-intelligence-certified/pic-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildPortfolioIntelligenceCertifiedConfiguration>[1],
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
  ppe.connectPortfolioPerformanceEngine();
  ppe.measureCompanyPerformance({
    companyReference: "company-alpha",
    metrics: {
      revenueIndex: 85,
      profitabilityIndex: 80,
      operationalEfficiencyIndex: 78,
      customerPerformanceIndex: 82,
      growthIndex: 88,
    },
    validated: true,
  });

  const cbk = createCrossBusinessKnowledgeEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
  });
  await cbk.initialize();

  const cde = createCapitalDistributionEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
  });
  await cde.initialize();

  const epd = createExecutivePortfolioDashboard(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
  });
  await epd.initialize();

  const pre = createPortfolioRiskEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
  });
  await pre.initialize();

  const pbe = createPortfolioBalanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
  });
  await pbe.initialize();

  const bhr = createBusinessHealthRanking(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
    portfolioBalanceEngine: pbe,
  });
  await bhr.initialize();

  const engine = createPortfolioIntelligenceCertified(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: mcr,
      portfolioPerformanceEngine: ppe,
      crossBusinessKnowledgeEngine: cbk,
      capitalDistributionEngine: cde,
      executivePortfolioDashboard: epd,
      portfolioRiskEngine: pre,
      portfolioBalanceEngine: pbe,
      businessHealthRanking: bhr,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-10 Portfolio Intelligence Certified", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCapitalDistributionEngineForTesting();
    resetExecutivePortfolioDashboardForTesting();
    resetPortfolioRiskEngineForTesting();
    resetPortfolioBalanceEngineForTesting();
    resetBusinessHealthRankingForTesting();
    resetPortfolioIntelligenceCertifiedForTesting();
  });

  test("buildPortfolioIntelligenceCertifiedConfiguration locks safety flags", () => {
    const config = buildPortfolioIntelligenceCertifiedConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyProductionSystemsUnlessSafeTestMode, true);
    assert.equal(config.safeTestMode, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(CERTIFIED_MODULE_IDS.length, 9);
    assert.ok(PIC_CAPABILITIES.includes("portfolio_framework_validation"));
    assert.ok(PIC_CAPABILITIES.includes("end_to_end_enterprise_portfolio_validation"));
  });

  test("portfolio intelligence certified initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PIC-001");
    assert.equal(state.missionId, "X2-10");
    assert.ok(
      PORTFOLIO_INTELLIGENCE_CERTIFIED_SYSTEM_PATH.includes("PORTFOLIO_INTELLIGENCE_CERTIFIED"),
    );
  });

  test("connectPortfolioIntelligenceCertified registers with EPF via X2-10", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectPortfolioIntelligenceCertified();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === PORTFOLIO_INTELLIGENCE_CERTIFIED_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence["enterprise-portfolio-framework"], true);
    assert.equal(report.engineRecord.dependencyPresence["business-health-ranking"], true);
  });

  test("certifyPortfolioIntelligence produces machine-readable pic-* certification reports", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioIntelligenceCertified();
    const report = engine.certifyPortfolioIntelligence({
      validated: true,
      runEndToEnd: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.certificationRunReportId.startsWith("pic-run-"));
    const record = report.certificationReports[0]!;
    assert.ok(record.certificationId.startsWith("pic-cert-"));
    assert.equal(record.metadataVersion, "PIC-001-v1");
    assert.equal(record.fabricatedCertificationFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.modifiedProductionSystemsWithoutSafeTestMode, false);
    assert.equal(record.perModulePassFailStatus.length, 9);
    assert.equal(record.endToEndPortfolioValidationResult, "pass");
    assert.equal(record.overallCertificationStatus, "certified");
    assert.ok(record.evidenceReferences.length > 0);
    assert.ok(record.certificationFingerprint.length > 0);
  });

  test("certification lifecycle module validators e2e report", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioIntelligenceCertified();
    engine.certifyPortfolioIntelligence({ validated: true });

    engine.validateEnterprisePortfolio();
    engine.validateCompanyRegistry();
    engine.validatePortfolioAnalytics();
    engine.validateKnowledgeSharing();
    engine.validateCapitalDistribution();
    engine.validateExecutiveDashboard();
    engine.validatePortfolioRisk();
    engine.validatePortfolioBalance();
    engine.validateBusinessHealth();
    engine.runEndToEndPortfolio();

    const report = engine.generateCertificationReport();
    assert.equal(report.action, "generate_certification_report");
    assert.ok(report.certificationReports[0]!.evidenceReferences.length > 0);
  });

  test("rejects unvalidated portfolio intelligence certification", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioIntelligenceCertified();
    const report = engine.certifyPortfolioIntelligence({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPicLog({
      event: "certification_start",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectPortfolioIntelligenceCertified();
    const logs = getPicLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, production, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyProductionSystemsUnlessSafeTestMode: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      safeTestMode: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyProductionSystemsUnlessSafeTestMode, true);
    assert.equal(config.safeTestMode, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report certification health", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioIntelligenceCertified();
    engine.certifyPortfolioIntelligence({ validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalCertificationReports >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.equal(cockpit.overallCertificationStatus, "certified");
  });

  test("repeated certification runs remain stable", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioIntelligenceCertified();
    const first = engine.certifyPortfolioIntelligence({ validated: true, runEndToEnd: true });
    const second = engine.certifyPortfolioIntelligence({ validated: true, runEndToEnd: true });
    assert.notEqual(first.validation.decision, "fail");
    assert.notEqual(second.validation.decision, "fail");
    assert.ok(engine.getCertificationReports().length >= 2);
    const state = engine.getState();
    assert.ok(state.performance.certificationsRun >= 2);
    assert.ok(state.health.healthScore >= 50);
  });
});
