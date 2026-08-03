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
  createPortfolioIntelligenceCertified,
  resetPortfolioIntelligenceCertifiedForTesting,
} from "../../portfolio-intelligence-certified/index.js";
import {
  createCrossCompanyResourceEngine,
  resetCrossCompanyResourceEngineForTesting,
  buildCrossCompanyResourceEngineConfiguration,
  CROSS_COMPANY_RESOURCE_ENGINE_SYSTEM_PATH,
  CCRE_CAPABILITIES,
  CROSS_COMPANY_RESOURCE_ENGINE_ID,
} from "../../cross-company-resource-engine/index.js";
import {
  appendCcreLog,
  getCcreLogs,
} from "../../cross-company-resource-engine/ccre-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildCrossCompanyResourceEngineConfiguration>[1],
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

  const cde = createCapitalDistributionEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
  });
  await cde.initialize();

  const pic = createPortfolioIntelligenceCertified(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: null,
    portfolioRiskEngine: null,
    portfolioBalanceEngine: null,
    businessHealthRanking: null,
  });
  await pic.initialize();

  const engine = createCrossCompanyResourceEngine(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: mcr,
      portfolioPerformanceEngine: ppe,
      crossBusinessKnowledgeEngine: cbk,
      capitalDistributionEngine: cde,
      portfolioIntelligenceCertified: pic,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-11 Cross-Company Resource Engine", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCapitalDistributionEngineForTesting();
    resetPortfolioIntelligenceCertifiedForTesting();
    resetCrossCompanyResourceEngineForTesting();
  });

  test("buildCrossCompanyResourceEngineConfiguration locks safety flags", () => {
    const config = buildCrossCompanyResourceEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAllocateProtectedResourcesWithoutAuthorization, true);
    assert.equal(config.preserveAllocationTraceability, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.ok(CCRE_CAPABILITIES.includes("cross_company_resource_allocation"));
    assert.ok(CCRE_CAPABILITIES.includes("idle_resource_detection"));
  });

  test("cross-company resource engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CCRE-001");
    assert.equal(state.missionId, "X2-11");
    assert.ok(CROSS_COMPANY_RESOURCE_ENGINE_SYSTEM_PATH.includes("CROSS_COMPANY_RESOURCE"));
  });

  test("connectCrossCompanyResourceEngine registers with EPF via X2-11", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectCrossCompanyResourceEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === CROSS_COMPANY_RESOURCE_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.capitalDistributionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioIntelligenceCertified, true);
  });

  test("register and allocate resources across companies with ccre-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossCompanyResourceEngine();

    const registered = engine.registerResource({
      resourceIdentifier: "shared-ai-inference",
      resourceCategory: "ai_capability",
      owningCompany: "company-alpha",
      utilizationScore: 60,
      validated: true,
    });
    assert.notEqual(registered.validation.decision, "fail", registered.validation.errors.join("; "));
    assert.ok(registered.resourceRunReportId.startsWith("ccre-run-"));
    const record = registered.resourceRecords[0]!;
    assert.ok(record.resourceAllocationId.startsWith("ccre-alloc-"));
    assert.equal(record.metadataVersion, "CCRE-001-v1");
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.sensitiveEnterpriseData, false);

    const allocated = engine.allocateResource({
      resourceIdentifier: "shared-ai-inference",
      assignedCompany: "company-beta",
      utilizationScore: 70,
      validated: true,
    });
    assert.notEqual(allocated.validation.decision, "fail", allocated.validation.errors.join("; "));
    assert.equal(allocated.resourceRecords[0]!.assignedCompany, "company-beta");
    assert.equal(allocated.resourceRecords[0]!.allocationStatus, "shared");
  });

  test("detects idle resources and generates optimization recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossCompanyResourceEngine();
    engine.registerResource({
      resourceIdentifier: "idle-gpu-pool",
      resourceCategory: "infrastructure",
      owningCompany: "company-alpha",
      utilizationScore: 10,
      validated: true,
    });
    engine.registerResource({
      resourceIdentifier: "ops-billing-service",
      resourceCategory: "operational_service",
      owningCompany: "company-beta",
      utilizationScore: 55,
      validated: true,
    });

    const idle = engine.detectIdleResources({ validated: true });
    assert.notEqual(idle.validation.decision, "fail");
    assert.ok(idle.resourceRecords.some((r) => r.resourceIdentifier === "idle-gpu-pool"));
    assert.equal(idle.resourceRecords[0]!.allocationStatus, "idle");

    const optimized = engine.optimizeResources({ validated: true });
    assert.notEqual(optimized.validation.decision, "fail");
    assert.ok(optimized.recommendations.length >= 1);

    const recommended = engine.generateRecommendations();
    assert.ok(recommended.recommendations.some((r) => r.recommendationType === "release_idle" || r.recommendationType === "share" || r.recommendationType === "manual_review"));
  });

  test("detects protected resource conflicts without authorization", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossCompanyResourceEngine();
    engine.registerResource({
      resourceIdentifier: "protected-vault",
      resourceCategory: "asset",
      owningCompany: "company-alpha",
      utilizationScore: 40,
      protectedResource: true,
      authorizedAllocation: false,
      validated: true,
    });
    const blocked = engine.allocateResource({
      resourceIdentifier: "protected-vault",
      assignedCompany: "company-beta",
      validated: true,
    });
    assert.equal(blocked.validation.decision, "fail");

    const conflicts = engine.detectConflicts({ validated: true });
    assert.ok(
      conflicts.conflictSignals.some((c) => c.conflictType === "protected_without_auth"),
    );
  });

  test("rejects unvalidated resource registration", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossCompanyResourceEngine();
    const report = engine.registerResource({
      resourceIdentifier: "unvalidated-asset",
      resourceCategory: "asset",
      owningCompany: "company-alpha",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCcreLog({
      event: "resource_registration",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectCrossCompanyResourceEngine();
    const logs = getCcreLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, authorization, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverAllocateProtectedResourcesWithoutAuthorization: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAllocateProtectedResourcesWithoutAuthorization, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report resource health", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossCompanyResourceEngine();
    engine.registerResource({
      resourceIdentifier: "shared-cdn",
      resourceCategory: "infrastructure",
      owningCompany: "company-alpha",
      utilizationScore: 65,
      validated: true,
    });
    engine.allocateResource({
      resourceIdentifier: "shared-cdn",
      assignedCompany: "company-beta",
      utilizationScore: 75,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalResourceRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
