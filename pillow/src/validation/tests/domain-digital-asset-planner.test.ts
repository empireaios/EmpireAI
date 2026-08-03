import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createCompanyFactoryFrameworkEngine,
  resetCompanyFactoryFrameworkForTesting,
} from "../../company-factory-framework/index.js";
import {
  createBusinessOpportunityDiscovery,
  resetBusinessOpportunityDiscoveryForTesting,
} from "../../business-opportunity-discovery/index.js";
import {
  createMarketValidationEngine,
  resetMarketValidationEngineForTesting,
} from "../../market-validation-engine/index.js";
import {
  createBusinessModelGenerator,
  resetBusinessModelGeneratorForTesting,
} from "../../business-model-generator/index.js";
import {
  createBrandCreationEngine,
  resetBrandCreationEngineForTesting,
} from "../../brand-creation-engine/index.js";
import {
  createDomainDigitalAssetPlanner,
  resetDomainDigitalAssetPlannerForTesting,
  buildDomainDigitalAssetPlannerConfiguration,
  DOMAIN_DIGITAL_ASSET_PLANNER_SYSTEM_PATH,
  DAP_CAPABILITIES,
  DOMAIN_DIGITAL_ASSET_PLANNER_ID,
} from "../../domain-digital-asset-planner/index.js";
import { appendDapLog, getDapLogs } from "../../domain-digital-asset-planner/dap-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildDomainDigitalAssetPlannerConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const cff = createCompanyFactoryFrameworkEngine(bootstrap);
  await cff.initialize();

  const bod = createBusinessOpportunityDiscovery(bootstrap, {
    companyFactoryFramework: cff,
  });
  await bod.initialize();
  bod.connectBusinessOpportunityDiscovery();
  bod.discoverOpportunities({ industry: "digital-services", validated: true });

  const mve = createMarketValidationEngine(bootstrap, {
    companyFactoryFramework: cff,
    businessOpportunityDiscovery: bod,
  });
  await mve.initialize();
  mve.connectMarketValidationEngine();
  mve.validateOpportunity({ industry: "digital-services", validated: true });

  const bmg = createBusinessModelGenerator(bootstrap, {
    companyFactoryFramework: cff,
    businessOpportunityDiscovery: bod,
    marketValidationEngine: mve,
  });
  await bmg.initialize();
  bmg.connectBusinessModelGenerator();
  bmg.generateBusinessModel({ industry: "digital-services", validated: true });

  const bce = createBrandCreationEngine(bootstrap, {
    companyFactoryFramework: cff,
    businessOpportunityDiscovery: bod,
    marketValidationEngine: mve,
    businessModelGenerator: bmg,
  });
  await bce.initialize();
  bce.connectBrandCreationEngine();
  bce.createBrand({ industry: "digital-services", validated: true });

  const engine = createDomainDigitalAssetPlanner(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessModelGenerator: bmg,
      brandCreationEngine: bce,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff, bmg, bce };
}

describe("X1-06 Domain & Digital Asset Planner", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
    resetBusinessOpportunityDiscoveryForTesting();
    resetMarketValidationEngineForTesting();
    resetBusinessModelGeneratorForTesting();
    resetBrandCreationEngineForTesting();
    resetDomainDigitalAssetPlannerForTesting();
  });

  test("buildDomainDigitalAssetPlannerConfiguration loads defaults", () => {
    const config = buildDomainDigitalAssetPlannerConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAutoRegisterOrPurchase, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(DAP_CAPABILITIES.includes("digital_asset_planning"));
  });

  test("domain digital asset planner initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-DAP-001");
    assert.equal(state.missionId, "X1-06");
    assert.ok(DOMAIN_DIGITAL_ASSET_PLANNER_SYSTEM_PATH.includes("DOMAIN_DIGITAL_ASSET"));
  });

  test("connectDomainDigitalAssetPlanner registers with Company Factory Framework via X1-06", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectDomainDigitalAssetPlanner();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === DOMAIN_DIGITAL_ASSET_PLANNER_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.businessModelGenerator, true);
    assert.equal(report.engineRecord.dependencyPresence.brandCreationEngine, true);
  });

  test("createPlan produces machine-readable dap-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectDomainDigitalAssetPlanner();
    const report = engine.createPlan({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.digitalAssetRunReportId.startsWith("dap-run-"));
    const record = report.planRecords[0]!;
    assert.ok(record.digitalAssetPlanId.startsWith("dap-plan-"));
    assert.equal(record.metadataVersion, "DAP-001-v1");
    assert.equal(record.fabricatedDigitalAssetFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.automaticRegistrationOrPurchase, false);
    assert.ok(record.proposedCompanyDomain.length > 0);
    assert.ok(record.alternativeDomains.length > 0);
    assert.ok(record.socialMediaHandlePlan.length > 0);
    assert.ok(record.emailDomainPlan.length > 0);
    assert.ok(record.websiteArchitectureSummary.length > 0);
    assert.ok(record.brandReference.length > 0);
  });

  test("planning lifecycle domains social website conflicts recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectDomainDigitalAssetPlanner();
    engine.createPlan({ industry: "consumer-goods", validated: true });

    const domains = engine.planCompanyDomains();
    assert.equal(domains.action, "plan_company_domains");
    engine.planDomainAlternatives();
    engine.planSocialHandles();
    engine.planEmailDomains();
    engine.planBrandAssetStructure();

    const website = engine.planWebsiteArchitecture();
    assert.equal(website.action, "plan_website_architecture");
    engine.planDigitalIdentityConsistency();
    engine.detectNamingConflicts();

    const recommendations = engine.generateRecommendations();
    assert.equal(recommendations.action, "generate_recommendations");
    assert.ok(recommendations.planRecords[0]!.recommendations.length > 0);
    assert.ok(
      recommendations.planRecords.every((r) => r.automaticRegistrationOrPurchase === false),
    );
  });

  test("rejects unvalidated digital asset planning", async () => {
    const { engine } = await buildEngine();
    engine.connectDomainDigitalAssetPlanner();
    const report = engine.createPlan({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendDapLog({
      event: "domain_planning",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectDomainDigitalAssetPlanner();
    const logs = getDapLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, auto-purchase, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverAutoRegisterOrPurchase: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAutoRegisterOrPurchase, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectDomainDigitalAssetPlanner();
    engine.createPlan({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalPlanRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
