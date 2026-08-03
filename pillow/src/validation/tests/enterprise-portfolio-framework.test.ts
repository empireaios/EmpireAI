import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createEnterprisePortfolioFrameworkEngine,
  resetEnterprisePortfolioFrameworkForTesting,
  buildEnterprisePortfolioFrameworkConfiguration,
  ENTERPRISE_PORTFOLIO_FRAMEWORK_SYSTEM_PATH,
  FRAMEWORK_CAPABILITIES,
} from "../../enterprise-portfolio-framework/index.js";
import type { PortfolioModuleDefinition } from "../../enterprise-portfolio-framework/index.js";
import {
  appendEpfLog,
  getEpfLogs,
} from "../../enterprise-portfolio-framework/epf-logging.js";

const TEMPLATE_MODULE: PortfolioModuleDefinition = {
  portfolioModuleIdentifier: "portfolio-template-alpha",
  moduleVersion: "1.0.0",
  moduleType: "template",
  eventRoutingConfig: {
    enabled: true,
    topics: ["portfolio.company.registered", "portfolio.lifecycle"],
    maxEventsPerMinute: 2,
    windowMs: 60000,
  },
  retryConfig: {
    enabled: true,
    maxAttempts: 3,
    delayMs: 10,
    backoffMultiplier: 2,
  },
  supportedCapabilities: [
    "portfolio_module_registration",
    "company_registration",
    "portfolio_lifecycle_management",
    "portfolio_event_routing",
    "portfolio_data_abstraction",
  ],
};

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEnterprisePortfolioFrameworkEngine(bootstrap);
  await engine.initialize();
  return engine;
}

describe("X2-01 Enterprise Portfolio Framework", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
  });

  test("buildEnterprisePortfolioFrameworkConfiguration loads defaults", () => {
    const config = buildEnterprisePortfolioFrameworkConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.preservePortfolioIsolation, true);
    assert.ok(FRAMEWORK_CAPABILITIES.includes("portfolio_module_registration"));
  });

  test("enterprise portfolio framework initializes with doctrine doc", async () => {
    const engine = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-EPF-001");
    assert.equal(state.missionId, "X2-01");
    assert.ok(ENTERPRISE_PORTFOLIO_FRAMEWORK_SYSTEM_PATH.includes("ENTERPRISE_PORTFOLIO"));
  });

  test("registerPortfolioModule produces machine-readable framework records", async () => {
    const engine = await buildEngine();
    const report = engine.registerPortfolioModule({ definition: TEMPLATE_MODULE });
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.portfolioFrameworkRunReportId.startsWith("epf-run-"));
    assert.equal(report.records.length, 1);
    const record = report.records[0]!;
    assert.ok(record.portfolioFrameworkId.startsWith("epf-"));
    assert.equal(record.portfolioModuleIdentifier, "portfolio-template-alpha");
    assert.equal(record.operationalState, "initialized");
    assert.equal(record.metadataVersion, "EPF-001-v1");
  });

  test("rejects specific portfolio integrations out of X2-01 scope", async () => {
    const engine = await buildEngine();
    const report = engine.registerPortfolioModule({
      definition: {
        ...TEMPLATE_MODULE,
        portfolioModuleIdentifier: "multi-company-registry",
      },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("out of scope")));
  });

  test("registerCompany attaches structural company references", async () => {
    const engine = await buildEngine();
    engine.registerPortfolioModule({ definition: TEMPLATE_MODULE });
    const report = engine.registerCompany({
      companyReference: "company-alpha-001",
      portfolioModuleIdentifier: "portfolio-template-alpha",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "register_company");
    assert.equal(engine.getRegisteredCompanies().length, 1);
    assert.ok(
      engine.getRegisteredModules()[0]?.registeredCompanies.includes("company-alpha-001"),
    );
  });

  test("portfolio module lifecycle activate suspend and shutdown", async () => {
    const engine = await buildEngine();
    engine.registerPortfolioModule({ definition: TEMPLATE_MODULE });
    const activated = engine.activatePortfolioModule("portfolio-template-alpha");
    assert.notEqual(activated.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "active");
    const suspended = engine.suspendPortfolioModule("portfolio-template-alpha");
    assert.notEqual(suspended.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "suspended");
    const shutdown = engine.shutdownPortfolioModule("portfolio-template-alpha");
    assert.notEqual(shutdown.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "shutdown");
  });

  test("portfolio event routing routes events", async () => {
    const engine = await buildEngine();
    engine.registerPortfolioModule({ definition: TEMPLATE_MODULE });
    engine.activatePortfolioModule("portfolio-template-alpha");
    engine.registerCompany({
      companyReference: "company-alpha-001",
      portfolioModuleIdentifier: "portfolio-template-alpha",
    });
    const report = engine.routePortfolioEvent({
      portfolioModuleIdentifier: "portfolio-template-alpha",
      topic: "portfolio.company.registered",
      payloadRef: "payload-ref-001",
      companyReference: "company-alpha-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_event");
  });

  test("portfolio data abstraction abstracts portfolio data", async () => {
    const engine = await buildEngine();
    engine.registerPortfolioModule({ definition: TEMPLATE_MODULE });
    engine.activatePortfolioModule("portfolio-template-alpha");
    const report = engine.abstractPortfolioData({
      portfolioModuleIdentifier: "portfolio-template-alpha",
      dataType: "portfolio_blueprint",
      payloadRef: "portfolio-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "abstract_data");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const engine = await buildEngine();
    appendEpfLog({
      event: "portfolio_event",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.registerPortfolioModule({ definition: TEMPLATE_MODULE });
    const logs = getEpfLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const engine = await buildEngine();
    engine.registerPortfolioModule({ definition: TEMPLATE_MODULE });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.registeredModules, 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });
});
