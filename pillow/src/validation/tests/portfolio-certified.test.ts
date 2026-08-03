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
} from "../../portfolio-intelligence-certified/index.js";
import {
  createCrossCompanyResourceEngine,
  resetCrossCompanyResourceEngineForTesting,
} from "../../cross-company-resource-engine/index.js";
import {
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
} from "../../customer-identity-engine/index.js";
import {
  createSharedCustomerIntelligence,
  resetSharedCustomerIntelligenceForTesting,
} from "../../shared-customer-intelligence/index.js";
import {
  createSharedSupplierIntelligence,
  resetSharedSupplierIntelligenceForTesting,
} from "../../shared-supplier-intelligence/index.js";
import {
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
} from "../../supplier-framework/index.js";
import {
  createPortfolioForecastEngine,
  resetPortfolioForecastEngineForTesting,
} from "../../portfolio-forecast-engine/index.js";
import {
  createAcquisitionEvaluationEngine,
  resetAcquisitionEvaluationEngineForTesting,
} from "../../acquisition-evaluation-engine/index.js";
import {
  createPortfolioOptimizationEngine,
  resetPortfolioOptimizationEngineForTesting,
} from "../../portfolio-optimization-engine/index.js";
import {
  createCompanyLifecycleManager,
  resetCompanyLifecycleManagerForTesting,
} from "../../company-lifecycle-manager/index.js";
import {
  createPortfolioExpansionPlanner,
  resetPortfolioExpansionPlannerForTesting,
} from "../../portfolio-expansion-planner/index.js";
import {
  createEnterpriseValueEngine,
  resetEnterpriseValueEngineForTesting,
} from "../../enterprise-value-engine/index.js";
import {
  createAutonomousPortfolioBoard,
  resetAutonomousPortfolioBoardForTesting,
} from "../../autonomous-portfolio-board/index.js";
import {
  createPortfolioCertified,
  resetPortfolioCertifiedForTesting,
  buildPortfolioCertifiedConfiguration,
  PORTFOLIO_CERTIFIED_SYSTEM_PATH,
  PTC_CAPABILITIES,
  PORTFOLIO_CERTIFIED_ID,
  CERTIFIED_MODULE_IDS,
} from "../../portfolio-certified/index.js";
import { appendPtcLog, getPtcLogs } from "../../portfolio-certified/ptc-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildPortfolioCertifiedConfiguration>[1],
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

  const pic = createPortfolioIntelligenceCertified(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
    portfolioBalanceEngine: pbe,
    businessHealthRanking: bhr,
  });
  await pic.initialize();

  const ccre = createCrossCompanyResourceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    portfolioIntelligenceCertified: pic,
  });
  await ccre.initialize();

  const cie = createCustomerIdentityEngine(bootstrap);
  await cie.initialize();
  cie.connectCustomerIdentityEngine();

  const sci = createSharedCustomerIntelligence(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    crossBusinessKnowledgeEngine: cbk,
    crossCompanyResourceEngine: ccre,
    customerIdentityEngine: cie,
    customerOperationsCertification: null,
  });
  await sci.initialize();

  const supplierFramework = createSupplierFrameworkEngine(bootstrap);
  await supplierFramework.initialize();

  const ssi = createSharedSupplierIntelligence(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    crossBusinessKnowledgeEngine: cbk,
    crossCompanyResourceEngine: ccre,
    supplierFramework,
    supplierOperationsCertification: null,
  });
  await ssi.initialize();

  const pfe = createPortfolioForecastEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
    portfolioBalanceEngine: pbe,
    businessHealthRanking: bhr,
    sharedCustomerIntelligence: sci,
    sharedSupplierIntelligence: ssi,
  });
  await pfe.initialize();

  const aee = createAcquisitionEvaluationEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    portfolioRiskEngine: pre,
    businessHealthRanking: bhr,
    sharedSupplierIntelligence: ssi,
    portfolioForecastEngine: pfe,
  });
  await aee.initialize();

  const poe = createPortfolioOptimizationEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    portfolioRiskEngine: pre,
    portfolioBalanceEngine: pbe,
    businessHealthRanking: bhr,
    sharedCustomerIntelligence: sci,
    sharedSupplierIntelligence: ssi,
    portfolioForecastEngine: pfe,
    acquisitionEvaluationEngine: aee,
  });
  await poe.initialize();

  const clm = createCompanyLifecycleManager(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    businessHealthRanking: bhr,
    portfolioForecastEngine: pfe,
    portfolioOptimizationEngine: poe,
  });
  await clm.initialize();

  const pep = createPortfolioExpansionPlanner(bootstrap, {
    enterprisePortfolioFramework: epf,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    portfolioRiskEngine: pre,
    businessHealthRanking: bhr,
    acquisitionEvaluationEngine: aee,
    portfolioOptimizationEngine: poe,
    companyLifecycleManager: clm,
  });
  await pep.initialize();

  const eve = createEnterpriseValueEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    businessHealthRanking: bhr,
    portfolioForecastEngine: pfe,
    acquisitionEvaluationEngine: aee,
    portfolioOptimizationEngine: poe,
    portfolioExpansionPlanner: pep,
  });
  await eve.initialize();

  const apb = createAutonomousPortfolioBoard(bootstrap, {
    enterprisePortfolioFramework: epf,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
    businessHealthRanking: bhr,
    portfolioForecastEngine: pfe,
    acquisitionEvaluationEngine: aee,
    portfolioOptimizationEngine: poe,
    companyLifecycleManager: clm,
    portfolioExpansionPlanner: pep,
    enterpriseValueEngine: eve,
  });
  await apb.initialize();

  const engine = createPortfolioCertified(
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
      portfolioIntelligenceCertified: pic,
      crossCompanyResourceEngine: ccre,
      sharedCustomerIntelligence: sci,
      sharedSupplierIntelligence: ssi,
      portfolioForecastEngine: pfe,
      acquisitionEvaluationEngine: aee,
      portfolioOptimizationEngine: poe,
      companyLifecycleManager: clm,
      portfolioExpansionPlanner: pep,
      enterpriseValueEngine: eve,
      autonomousPortfolioBoard: apb,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-21 Portfolio Certified", () => {
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
    resetCrossCompanyResourceEngineForTesting();
    resetCustomerIdentityEngineForTesting();
    resetSharedCustomerIntelligenceForTesting();
    resetSupplierFrameworkForTesting();
    resetSharedSupplierIntelligenceForTesting();
    resetPortfolioForecastEngineForTesting();
    resetAcquisitionEvaluationEngineForTesting();
    resetPortfolioOptimizationEngineForTesting();
    resetCompanyLifecycleManagerForTesting();
    resetPortfolioExpansionPlannerForTesting();
    resetEnterpriseValueEngineForTesting();
    resetAutonomousPortfolioBoardForTesting();
    resetPortfolioCertifiedForTesting();
  });

  test("buildPortfolioCertifiedConfiguration locks certification safety flags", () => {
    const config = buildPortfolioCertifiedConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.safeTestMode, true);
    assert.equal(config.neverModifyProductionSystemsUnlessSafeTestMode, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(CERTIFIED_MODULE_IDS.length, 20);
    assert.ok(PTC_CAPABILITIES.includes("end_to_end_enterprise_portfolio_validation"));
  });

  test("portfolio certified initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PTC-001");
    assert.equal(state.missionId, "X2-21");
    assert.ok(PORTFOLIO_CERTIFIED_SYSTEM_PATH.includes("PORTFOLIO_CERTIFIED"));
  });

  test("connectPortfolioCertified registers with EPF via X2-21", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectPortfolioCertified();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(modules.some((m) => m.portfolioModuleIdentifier === PORTFOLIO_CERTIFIED_ID));
    assert.equal(
      report.engineRecord.dependencyPresence["autonomous-portfolio-board"],
      true,
    );
    assert.equal(
      report.engineRecord.dependencyPresence["enterprise-portfolio-framework"],
      true,
    );
  });

  test("certifyPortfolio validates X2-01 through X2-20 with machine-readable ptc-* report", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioCertified();
    const report = engine.certifyPortfolio({
      validated: true,
      runEndToEnd: true,
      runCrossModule: true,
      runExecutiveGovernance: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.certificationRunReportId.startsWith("ptc-run-"));
    const cert = report.certificationReports[0]!;
    assert.ok(cert.certificationId.startsWith("ptc-cert-"));
    assert.equal(cert.metadataVersion, "PTC-001-v1");
    assert.equal(cert.validationResultsX201ToX220.length, 20);
    assert.equal(cert.structuralSignalOnly, true);
    assert.equal(cert.modifiedProductionSystemsWithoutSafeTestMode, false);
    assert.equal(cert.crossModuleIntegrationResult, "pass");
    assert.equal(cert.endToEndPortfolioWorkflowResult, "pass");
    assert.equal(cert.executiveGovernanceResult, "pass");
    assert.equal(cert.overallCertificationStatus, "certified");
    assert.ok(cert.overallPortfolioReadinessScore >= 85);
  });

  test("cross-module e2e and governance validators pass independently", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioCertified();
    assert.notEqual(
      engine.validateCrossModule({ validated: true }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.validateEndToEnd({ validated: true }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.validateExecutiveGovernance({ validated: true }).validation.decision,
      "fail",
    );
    const generated = engine.generateCertificationReport({ validated: true });
    assert.notEqual(generated.validation.decision, "fail");
  });

  test("rejects unvalidated portfolio certification", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioCertified();
    const report = engine.certifyPortfolio({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive enterprise values in logs", async () => {
    const { engine } = await buildEngine();
    appendPtcLog({
      event: "module_validation",
      level: "info",
      details: "api_key=secret-key token=bearer-abc",
    });
    engine.connectPortfolioCertified();
    const logs = getPtcLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("bearer-abc")));
  });

  test("never disables safe-test-mode or credential guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      safeTestMode: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyProductionSystemsUnlessSafeTestMode: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeAuthenticationTokens: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.safeTestMode, true);
    assert.equal(config.neverModifyProductionSystemsUnlessSafeTestMode, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report certification health", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioCertified();
    engine.certifyPortfolio({ validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.overallCertificationStatus, "certified");
    assert.ok((cockpit.dependenciesConnected ?? 0) >= 15);
  });

  test("diagnostics report certification status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioCertified();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(
      ["healthy", "degraded", "standby", "failed"].includes(report.engineRecord.healthStatus),
    );
  });
});
