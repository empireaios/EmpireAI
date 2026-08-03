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
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
} from "../../customer-identity-engine/index.js";
import {
  createSharedCustomerIntelligence,
  resetSharedCustomerIntelligenceForTesting,
  buildSharedCustomerIntelligenceConfiguration,
  SHARED_CUSTOMER_INTELLIGENCE_SYSTEM_PATH,
  SCI_CAPABILITIES,
  SHARED_CUSTOMER_INTELLIGENCE_ID,
} from "../../shared-customer-intelligence/index.js";
import { appendSciLog, getSciLogs } from "../../shared-customer-intelligence/sci-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildSharedCustomerIntelligenceConfiguration>[1],
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

  const cie = createCustomerIdentityEngine(bootstrap);
  await cie.initialize();
  cie.connectCustomerIdentityEngine();

  const engine = createSharedCustomerIntelligence(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: mcr,
      crossBusinessKnowledgeEngine: cbk,
      crossCompanyResourceEngine: ccre,
      customerIdentityEngine: cie,
      customerOperationsCertification: null,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-12 Shared Customer Intelligence", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCrossCompanyResourceEngineForTesting();
    resetCustomerIdentityEngineForTesting();
    resetSharedCustomerIntelligenceForTesting();
  });

  test("buildSharedCustomerIntelligenceConfiguration locks privacy safety flags", () => {
    const config = buildSharedCustomerIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.privacyRulesEnabled, true);
    assert.equal(config.neverViolateCustomerPrivacyPolicies, true);
    assert.equal(config.neverLogSensitiveCustomerInformation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.ok(SCI_CAPABILITIES.includes("customer_knowledge_consolidation"));
    assert.ok(SCI_CAPABILITIES.includes("cross_selling_opportunity_detection"));
  });

  test("shared customer intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SCI-001");
    assert.equal(state.missionId, "X2-12");
    assert.ok(SHARED_CUSTOMER_INTELLIGENCE_SYSTEM_PATH.includes("SHARED_CUSTOMER_INTELLIGENCE"));
  });

  test("connectSharedCustomerIntelligence registers with EPF via X2-12", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectSharedCustomerIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === SHARED_CUSTOMER_INTELLIGENCE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.crossCompanyResourceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.customerIdentityEngine, true);
  });

  test("consolidate and resolve produce machine-readable sci-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedCustomerIntelligence();

    const consolidated = engine.consolidateCustomerKnowledge({
      customerReference: "customer-alpha-1",
      companyReferences: ["company-alpha"],
      profileSummary: "Structural repeat buyer profile",
      preferenceSignals: ["quality", "speed"],
      lifetimeValueHint: 72,
      validated: true,
    });
    assert.notEqual(
      consolidated.validation.decision,
      "fail",
      consolidated.validation.errors.join("; "),
    );
    assert.ok(consolidated.customerIntelligenceRunReportId.startsWith("sci-run-"));
    const record = consolidated.intelligenceRecords[0]!;
    assert.ok(record.customerIntelligenceId.startsWith("sci-ci-"));
    assert.equal(record.metadataVersion, "SCI-001-v1");
    assert.equal(record.privacySafe, true);
    assert.equal(record.sensitiveCustomerData, false);
    assert.equal(record.structuralSignalOnly, true);

    const resolved = engine.resolveCustomerIdentity({
      customerReference: "customer-alpha-1",
      companyReferences: ["company-alpha", "company-beta"],
      validated: true,
    });
    assert.notEqual(resolved.validation.decision, "fail");
    assert.equal(resolved.intelligenceRecords[0]!.crossCompanyRelationship, true);
    assert.ok(resolved.intelligenceRecords[0]!.associatedCompanies.includes("company-beta"));
  });

  test("behaviour analysis insights cross-sell and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedCustomerIntelligence();
    engine.consolidateCustomerKnowledge({
      customerReference: "customer-beta-9",
      companyReferences: ["company-alpha"],
      lifetimeValueHint: 80,
      validated: true,
    });
    engine.resolveCustomerIdentity({
      customerReference: "customer-beta-9",
      companyReferences: ["company-alpha", "company-beta"],
      validated: true,
    });
    const behaviour = engine.analyzeCustomerBehaviour({
      customerReference: "customer-beta-9",
      behaviourSignals: ["repeat_purchase", "cross_channel"],
      validated: true,
    });
    assert.notEqual(behaviour.validation.decision, "fail");
    assert.ok(behaviour.intelligenceRecords[0]!.behaviourSummary.includes("repeat_purchase"));

    const insights = engine.generateInsights({ validated: true });
    assert.notEqual(insights.validation.decision, "fail");
    assert.ok(insights.intelligenceRecords.length >= 1);

    const crossSell = engine.detectCrossSell({ validated: true });
    assert.ok(
      crossSell.intelligenceRecords.some((r) =>
        r.recommendedOpportunities.includes("cross_sell_bundle"),
      ),
    );

    const recommended = engine.generateRecommendations();
    assert.ok(recommended.recommendations.length >= 1);
    assert.ok(
      recommended.recommendations.some(
        (r) =>
          r.recommendationType === "cross_sell" ||
          r.recommendationType === "upsell" ||
          r.recommendationType === "manual_review",
      ),
    );
  });

  test("detects customer risks for low lifetime value", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedCustomerIntelligence();
    engine.consolidateCustomerKnowledge({
      customerReference: "customer-risk-1",
      companyReferences: ["company-alpha"],
      lifetimeValueHint: 15,
      validated: true,
    });
    const risks = engine.detectCustomerRisks({ validated: true });
    assert.ok(risks.riskSignals.some((r) => r.riskType === "churn"));
  });

  test("rejects unvalidated customer knowledge consolidation", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedCustomerIntelligence();
    const report = engine.consolidateCustomerKnowledge({
      customerReference: "customer-unvalidated",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive customer values in logs", async () => {
    const { engine } = await buildEngine();
    appendSciLog({
      event: "customer_synchronization",
      level: "info",
      details: "email=user@example.com api_key=secret-key",
    });
    engine.connectSharedCustomerIntelligence();
    const logs = getSciLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("user@example.com")));
  });

  test("never disables privacy, credential, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      privacyRulesEnabled: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverViolateCustomerPrivacyPolicies: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveCustomerInformation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.privacyRulesEnabled, true);
    assert.equal(config.neverViolateCustomerPrivacyPolicies, true);
    assert.equal(config.neverLogSensitiveCustomerInformation, true);
    assert.equal(config.structuralSignalsOnly, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report intelligence health", async () => {
    const { engine } = await buildEngine();
    engine.connectSharedCustomerIntelligence();
    engine.consolidateCustomerKnowledge({
      customerReference: "customer-cockpit-1",
      companyReferences: ["company-alpha", "company-beta"],
      lifetimeValueHint: 68,
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
});
