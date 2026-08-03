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
  buildMultiCompanyRegistryConfiguration,
  MULTI_COMPANY_REGISTRY_SYSTEM_PATH,
  MCR_CAPABILITIES,
  MULTI_COMPANY_REGISTRY_ID,
} from "../../multi-company-registry/index.js";
import { appendMcrLog, getMcrLogs } from "../../multi-company-registry/mcr-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const epf = createEnterprisePortfolioFrameworkEngine(bootstrap);
  await epf.initialize();

  const engine = createMultiCompanyRegistry(bootstrap, {
    enterprisePortfolioFramework: epf,
  });
  await engine.initialize();
  return { engine, epf };
}

describe("X2-02 Multi-Company Registry", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
  });

  test("buildMultiCompanyRegistryConfiguration loads defaults", () => {
    const config = buildMultiCompanyRegistryConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverRegisterDuplicatesWithoutValidation, true);
    assert.equal(config.preserveCompanyTraceability, true);
    assert.ok(MCR_CAPABILITIES.includes("company_registration"));
  });

  test("multi-company registry initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MCR-001");
    assert.equal(state.missionId, "X2-02");
    assert.ok(MULTI_COMPANY_REGISTRY_SYSTEM_PATH.includes("MULTI_COMPANY"));
  });

  test("connectMultiCompanyRegistry registers with Enterprise Portfolio Framework via X2-02", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectMultiCompanyRegistry();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(modules.some((m) => m.portfolioModuleIdentifier === MULTI_COMPANY_REGISTRY_ID));
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
  });

  test("registerCompany produces machine-readable mcr-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectMultiCompanyRegistry();
    const report = engine.registerCompany({
      companyName: "Alpha Commerce Co",
      companyCategory: "commerce",
      ownershipReference: "structural://ownership/alpha",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.registryRunReportId.startsWith("mcr-run-"));
    const record = report.companyRecords[0]!;
    assert.ok(record.companyRegistryId.startsWith("mcr-"));
    assert.equal(record.metadataVersion, "MCR-001-v1");
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.companyName, "Alpha Commerce Co");
  });

  test("rejects duplicate company registration without allowDuplicate", async () => {
    const { engine } = await buildEngine();
    engine.connectMultiCompanyRegistry();
    engine.registerCompany({
      companyName: "Alpha Commerce Co",
      ownershipReference: "structural://ownership/alpha",
      validated: true,
    });
    const duplicate = engine.registerCompany({
      companyName: "Alpha Commerce Co",
      ownershipReference: "structural://ownership/alpha",
      validated: true,
    });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("profile update classification and lifecycle tracking", async () => {
    const { engine } = await buildEngine();
    engine.connectMultiCompanyRegistry();
    const registered = engine.registerCompany({
      companyName: "Beta Services",
      companyCategory: "general",
      companyLifecycleStage: "forming",
      ownershipReference: "structural://ownership/beta",
      validated: true,
    });
    const companyId = registered.companyRecords[0]!.companyId;

    const updated = engine.updateProfile({
      companyId,
      companyName: "Beta Services Ltd",
      validated: true,
    });
    assert.notEqual(updated.validation.decision, "fail");
    assert.equal(updated.companyRecords[0]?.companyName, "Beta Services Ltd");

    const classified = engine.classifyCompany({
      companyId,
      companyCategory: "services",
      validated: true,
    });
    assert.equal(classified.companyRecords[0]?.companyCategory, "services");

    const lifecycle = engine.advanceLifecycle({
      companyId,
      companyLifecycleStage: "launching",
      validated: true,
    });
    assert.equal(lifecycle.companyRecords[0]?.companyLifecycleStage, "launching");
  });

  test("generateRecommendations produces structural recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectMultiCompanyRegistry();
    engine.registerCompany({
      companyName: "Gamma Digital",
      companyCategory: "general",
      ownershipReference: "structural://ownership/gamma",
      validated: true,
    });
    const report = engine.generateRecommendations();
    assert.equal(report.action, "recommend");
    assert.ok(report.recommendations.length > 0);
    assert.ok(report.recommendations.every((r) => r.structuralSignalOnly === true));
  });

  test("rejects unvalidated registration", async () => {
    const { engine } = await buildEngine();
    engine.connectMultiCompanyRegistry();
    const report = engine.registerCompany({
      companyName: "Delta Co",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendMcrLog({
      event: "company_registration",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectMultiCompanyRegistry();
    const logs = getMcrLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectMultiCompanyRegistry();
    engine.registerCompany({
      companyName: "Epsilon Hold",
      ownershipReference: "structural://ownership/epsilon",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.totalCompanyRecords, 1);
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
