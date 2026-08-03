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
  createSharedSupplierIntelligence,
  resetSharedSupplierIntelligenceForTesting,
} from "../../shared-supplier-intelligence/index.js";
import {
  createCrossCompanyResourceEngine,
  resetCrossCompanyResourceEngineForTesting,
} from "../../cross-company-resource-engine/index.js";
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
  buildCompanyLifecycleManagerConfiguration,
  COMPANY_LIFECYCLE_MANAGER_SYSTEM_PATH,
  CLM_CAPABILITIES,
  COMPANY_LIFECYCLE_MANAGER_ID,
} from "../../company-lifecycle-manager/index.js";
import { appendClmLog, getClmLogs } from "../../company-lifecycle-manager/clm-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildCompanyLifecycleManagerConfiguration>[1],
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

  const ccre = createCrossCompanyResourceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    portfolioIntelligenceCertified: null,
  });
  await ccre.initialize();

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
    sharedCustomerIntelligence: null,
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
    sharedCustomerIntelligence: null,
    sharedSupplierIntelligence: ssi,
    portfolioForecastEngine: pfe,
    acquisitionEvaluationEngine: aee,
  });
  await poe.initialize();

  const engine = createCompanyLifecycleManager(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: mcr,
      portfolioPerformanceEngine: ppe,
      businessHealthRanking: bhr,
      portfolioForecastEngine: pfe,
      portfolioOptimizationEngine: poe,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-17 Company Lifecycle Manager", () => {
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
    resetCrossCompanyResourceEngineForTesting();
    resetSupplierFrameworkForTesting();
    resetSharedSupplierIntelligenceForTesting();
    resetPortfolioForecastEngineForTesting();
    resetAcquisitionEvaluationEngineForTesting();
    resetPortfolioOptimizationEngineForTesting();
    resetCompanyLifecycleManagerForTesting();
  });

  test("buildCompanyLifecycleManagerConfiguration locks transition safety flags", () => {
    const config = buildCompanyLifecycleManagerConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(
      config.neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies,
      true,
    );
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(CLM_CAPABILITIES.includes("company_lifecycle_stage_management"));
    assert.ok(CLM_CAPABILITIES.includes("lifecycle_recommendations"));
  });

  test("company lifecycle manager initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CLM-001");
    assert.equal(state.missionId, "X2-17");
    assert.ok(COMPANY_LIFECYCLE_MANAGER_SYSTEM_PATH.includes("COMPANY_LIFECYCLE"));
  });

  test("connectCompanyLifecycleManager registers with EPF via X2-17", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectCompanyLifecycleManager();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === COMPANY_LIFECYCLE_MANAGER_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.multiCompanyRegistry, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioOptimizationEngine, true);
  });

  test("manage stage and assess maturity produce machine-readable clm-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyLifecycleManager();

    const managed = engine.manageStage({
      companyReference: "company-alpha",
      lifecycleStage: "launch",
      maturityHint: 28,
      validated: true,
    });
    assert.notEqual(managed.validation.decision, "fail", managed.validation.errors.join("; "));
    assert.ok(managed.lifecycleRunReportId.startsWith("clm-run-"));
    const record = managed.lifecycleRecords[0]!;
    assert.ok(record.lifecycleRecordId.startsWith("clm-lc-"));
    assert.equal(record.metadataVersion, "CLM-001-v1");
    assert.equal(record.autoTransitionBlocked, true);
    assert.equal(record.currentLifecycleStage, "launch");

    const assessed = engine.assessMaturity({
      companyReference: "company-alpha",
      maturityHint: 42,
      validated: true,
    });
    assert.notEqual(assessed.validation.decision, "fail");
    assert.equal(assessed.lifecycleRecords[0]!.maturityScore, 42);
  });

  test("launch growth mature retirement transitions recommend and analytics", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyLifecycleManager();

    assert.notEqual(
      engine.manageLaunch({
        companyReference: "company-beta",
        maturityHint: 20,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.manageGrowth({
        companyReference: "company-beta",
        maturityHint: 50,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.manageMature({
        companyReference: "company-alpha",
        maturityHint: 75,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.manageRetirement({
        companyReference: "company-alpha",
        maturityHint: 15,
        validated: true,
      }).validation.decision,
      "fail",
    );

    const transitions = engine.detectTransitions({ validated: true });
    assert.notEqual(transitions.validation.decision, "fail");

    const recommended = engine.generateRecommendations({ validated: true });
    assert.notEqual(recommended.validation.decision, "fail");
    assert.ok(recommended.recommendations.every((r) => r.autoTransitionBlocked === true));

    const analytics = engine.runAnalytics({ validated: true });
    assert.notEqual(analytics.validation.decision, "fail");
    assert.ok(analytics.lifecycleRecords.length >= 1);
  });

  test("rejects unvalidated lifecycle stage management", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyLifecycleManager();
    const report = engine.manageStage({
      companyReference: "company-alpha",
      lifecycleStage: "growth",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive enterprise values in logs", async () => {
    const { engine } = await buildEngine();
    appendClmLog({
      event: "lifecycle_assessment",
      level: "info",
      details: "api_key=secret-key token=bearer-abc",
    });
    engine.connectCompanyLifecycleManager();
    const logs = getClmLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("bearer-abc")));
  });

  test("never disables transition approval or credential guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveEnterpriseInformation: false,
    });
    const config = engine.getState().configuration;
    assert.equal(
      config.neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies,
      true,
    );
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report lifecycle health", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyLifecycleManager();
    engine.manageStage({
      companyReference: "company-alpha",
      lifecycleStage: "growth",
      maturityHint: 55,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalLifecycleRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });

  test("diagnostics report lifecycle status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyLifecycleManager();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(
      ["healthy", "degraded", "standby", "failed"].includes(report.engineRecord.healthStatus),
    );
  });
});
