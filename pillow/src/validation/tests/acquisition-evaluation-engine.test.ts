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
  buildAcquisitionEvaluationEngineConfiguration,
  ACQUISITION_EVALUATION_ENGINE_SYSTEM_PATH,
  AEE_CAPABILITIES,
  ACQUISITION_EVALUATION_ENGINE_ID,
} from "../../acquisition-evaluation-engine/index.js";
import { appendAeeLog, getAeeLogs } from "../../acquisition-evaluation-engine/aee-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildAcquisitionEvaluationEngineConfiguration>[1],
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

  const engine = createAcquisitionEvaluationEngine(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      portfolioPerformanceEngine: ppe,
      capitalDistributionEngine: cde,
      portfolioRiskEngine: pre,
      businessHealthRanking: bhr,
      sharedSupplierIntelligence: ssi,
      portfolioForecastEngine: pfe,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-15 Acquisition Evaluation Engine", () => {
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
  });

  test("buildAcquisitionEvaluationEngineConfiguration locks validation safety flags", () => {
    const config = buildAcquisitionEvaluationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendUsingUnvalidatedInformation, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(AEE_CAPABILITIES.includes("acquisition_candidate_discovery"));
    assert.ok(AEE_CAPABILITIES.includes("acquisition_recommendations"));
  });

  test("acquisition evaluation engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AEE-001");
    assert.equal(state.missionId, "X2-15");
    assert.ok(ACQUISITION_EVALUATION_ENGINE_SYSTEM_PATH.includes("ACQUISITION_EVALUATION"));
  });

  test("connectAcquisitionEvaluationEngine registers with EPF via X2-15", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectAcquisitionEvaluationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === ACQUISITION_EVALUATION_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioPerformanceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioForecastEngine, true);
  });

  test("discover and evaluate produce machine-readable aee-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectAcquisitionEvaluationEngine();

    const discovered = engine.discoverCandidates({
      candidateBusinesses: ["Target Alpha Commerce"],
      industryHints: ["commerce"],
      validated: true,
    });
    assert.notEqual(
      discovered.validation.decision,
      "fail",
      discovered.validation.errors.join("; "),
    );
    assert.ok(discovered.acquisitionRunReportId.startsWith("aee-run-"));
    assert.ok(discovered.acquisitionRecords[0]!.acquisitionEvaluationId.startsWith("aee-ae-"));

    const evaluated = engine.evaluateOpportunity({
      candidateBusiness: "Target Alpha Commerce",
      industry: "commerce",
      strategicFitHint: 80,
      financialHint: 78,
      riskHint: 30,
      operationalMaturityHint: 72,
      estimatedValueHint: 1_200_000,
      validated: true,
    });
    assert.notEqual(evaluated.validation.decision, "fail");
    const record = evaluated.acquisitionRecords[0]!;
    assert.equal(record.metadataVersion, "AEE-001-v1");
    assert.equal(record.validatedInformationOnly, true);
    assert.ok(record.strategicFitScore >= 55);
    assert.ok(record.financialScore >= 50);
    assert.ok(record.estimatedAcquisitionValue > 0);
  });

  test("strategic financial operational risk value rank and recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectAcquisitionEvaluationEngine();
    engine.discoverCandidates({
      candidateBusinesses: ["Target Beta Services", "Target Gamma Weak"],
      industryHints: ["services", "general"],
      validated: true,
    });
    engine.evaluateOpportunity({
      candidateBusiness: "Target Beta Services",
      industry: "services",
      strategicFitHint: 85,
      financialHint: 82,
      riskHint: 25,
      operationalMaturityHint: 80,
      estimatedValueHint: 2_000_000,
      validated: true,
    });
    engine.evaluateOpportunity({
      candidateBusiness: "Target Gamma Weak",
      industry: "general",
      strategicFitHint: 40,
      financialHint: 35,
      riskHint: 80,
      operationalMaturityHint: 30,
      estimatedValueHint: 100_000,
      validated: true,
    });

    assert.notEqual(
      engine.evaluateStrategicFit({
        candidateBusiness: "Target Beta Services",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.evaluateFinancial({
        candidateBusiness: "Target Beta Services",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.evaluateOperationalMaturity({
        candidateBusiness: "Target Beta Services",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.evaluateRisks({
        candidateBusiness: "Target Beta Services",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.estimateValue({
        candidateBusiness: "Target Beta Services",
        validated: true,
      }).validation.decision,
      "fail",
    );

    const ranked = engine.rankOpportunities({ validated: true });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.acquisitionRecords.some((r) => r.rankedPosition === 1));

    const recommended = engine.generateRecommendations({ validated: true });
    assert.notEqual(recommended.validation.decision, "fail");
    assert.ok(recommended.recommendations.length >= 1);
    assert.ok(
      recommended.recommendations.some(
        (r) =>
          r.recommendationType === "pursue" ||
          r.recommendationType === "diligence" ||
          r.recommendationType === "monitor" ||
          r.recommendationType === "pass" ||
          r.recommendationType === "manual_review",
      ),
    );
  });

  test("rejects unvalidated acquisition evaluation", async () => {
    const { engine } = await buildEngine();
    engine.connectAcquisitionEvaluationEngine();
    const report = engine.evaluateOpportunity({
      candidateBusiness: "Unvalidated Target",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive enterprise values in logs", async () => {
    const { engine } = await buildEngine();
    appendAeeLog({
      event: "candidate_discovery",
      level: "info",
      details: "api_key=secret-key token=bearer-abc",
    });
    engine.connectAcquisitionEvaluationEngine();
    const logs = getAeeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("bearer-abc")));
  });

  test("never disables unvalidated-recommendation or credential guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverRecommendUsingUnvalidatedInformation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveEnterpriseInformation: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverRecommendUsingUnvalidatedInformation, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report acquisition health", async () => {
    const { engine } = await buildEngine();
    engine.connectAcquisitionEvaluationEngine();
    engine.evaluateOpportunity({
      candidateBusiness: "Cockpit Target",
      industry: "technology",
      strategicFitHint: 75,
      financialHint: 70,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalAcquisitionRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });

  test("diagnostics report acquisition status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAcquisitionEvaluationEngine();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(
      ["healthy", "degraded", "standby", "failed"].includes(report.engineRecord.healthStatus),
    );
  });
});
