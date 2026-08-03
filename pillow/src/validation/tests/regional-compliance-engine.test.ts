import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createGlobalExpansionFrameworkEngine,
  resetGlobalExpansionFrameworkForTesting,
} from "../../global-expansion-framework/index.js";
import {
  createCountryIntelligenceEngine,
  resetCountryIntelligenceEngineForTesting,
} from "../../country-intelligence-engine/index.js";
import {
  createLocalizationEngine,
  resetLocalizationEngineForTesting,
} from "../../localization-engine/index.js";
import {
  createLanguageIntelligenceEngine,
  resetLanguageIntelligenceForTesting,
} from "../../language-intelligence/index.js";
import {
  createCurrencyIntelligenceEngine,
  resetCurrencyIntelligenceForTesting,
} from "../../currency-intelligence/index.js";
import {
  createRegionalComplianceEngine,
  resetRegionalComplianceEngineForTesting,
  buildRegionalComplianceEngineConfiguration,
  REGIONAL_COMPLIANCE_ENGINE_SYSTEM_PATH,
  REGIONAL_COMPLIANCE_ENGINE_ID,
  RCE_CAPABILITIES,
  RCE_METADATA_VERSION,
} from "../../regional-compliance-engine/index.js";
import {
  appendRceLog,
  getRceLogs,
} from "../../regional-compliance-engine/rce-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const gef = createGlobalExpansionFrameworkEngine(bootstrap);
  await gef.initialize();
  const cie = createCountryIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
  });
  await cie.initialize();
  const loc = createLocalizationEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
  });
  await loc.initialize();
  const li = createLanguageIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
  });
  await li.initialize();
  const cur = createCurrencyIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
  });
  await cur.initialize();
  const engine = createRegionalComplianceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
  });
  await engine.initialize();
  return { engine, gef };
}

describe("X4-06 Regional Compliance Engine", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
    resetCountryIntelligenceEngineForTesting();
    resetLocalizationEngineForTesting();
    resetLanguageIntelligenceForTesting();
    resetCurrencyIntelligenceForTesting();
    resetRegionalComplianceEngineForTesting();
  });

  test("buildRegionalComplianceEngineConfiguration locks safety flags", () => {
    const config = buildRegionalComplianceEngineConfiguration(REPO_ROOT, {
      neverFalselyCertifyCompliance: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverFalselyCertifyCompliance, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveRegulatoryTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveComplianceInformation, true);
    assert.ok(RCE_CAPABILITIES.includes("compliance_risk_assessment"));
    assert.ok(RCE_CAPABILITIES.includes("regulatory_change_monitoring"));
  });

  test("regional compliance engine initializes with doctrine PILLOW-RCE-001 / X4-06", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RCE-001");
    assert.equal(state.missionId, "X4-06");
    assert.ok(REGIONAL_COMPLIANCE_ENGINE_SYSTEM_PATH.includes("REGIONAL_COMPLIANCE"));
  });

  test("connectRegionalComplianceEngine registers with GEF via X4-06", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectRegionalComplianceEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === REGIONAL_COMPLIANCE_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.currencyIntelligence, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("country/regulatory/rules assessments produce rce-* records without certification", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalComplianceEngine();

    const country = engine.manageCountryRequirements({
      country: "SG",
      alignmentHint: 80,
      riskHint: 30,
      validated: true,
    });
    assert.notEqual(country.validation.decision, "fail", country.validation.errors.join("; "));
    assert.ok(country.complianceRunReportId.startsWith("rce-run-"));
    const record = country.complianceRecords[0]!;
    assert.ok(record.complianceRecordId.startsWith("rce-"));
    assert.equal(record.metadataVersion, RCE_METADATA_VERSION);
    assert.equal(record.neverFalselyCertifyCompliance, true);
    assert.equal(record.certificationClaim, "none");
    assert.equal(record.regulationCategory, "country_specific");

    const regulatory = engine.monitorRegulatoryChanges({
      country: "DE",
      validated: true,
    });
    assert.equal(regulatory.complianceRecords[0]!.regulationCategory, "regulatory_change");

    const rules = engine.manageBusinessRules({
      country: "AU",
      validated: true,
    });
    assert.equal(rules.complianceRecords[0]!.regulationCategory, "business_rules");
  });

  test("rejects unvalidated path and never certifies", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalComplianceEngine();
    const report = engine.manageCountryRequirements({ country: "XX" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("operational, marketplace, and data protection assessments", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalComplianceEngine();

    const operational = engine.assessOperational({ country: "JP", validated: true });
    assert.equal(operational.complianceRecords[0]!.regulationCategory, "operational");

    const marketplace = engine.assessMarketplace({ country: "US", validated: true });
    assert.equal(marketplace.complianceRecords[0]!.regulationCategory, "marketplace");

    const dp = engine.assessDataProtection({ country: "EU", validated: true });
    assert.equal(dp.complianceRecords[0]!.regulationCategory, "data_protection");
    assert.equal(dp.complianceRecords[0]!.certificationClaim, "none");
  });

  test("violations, risks, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalComplianceEngine();

    const violations = engine.detectViolations({
      country: "BR",
      violationHint: true,
      riskHint: 85,
      validated: true,
    });
    assert.notEqual(
      violations.validation.decision,
      "fail",
      violations.validation.errors.join("; "),
    );
    assert.equal(violations.complianceRecords[0]!.violationDetected, true);

    const risks = engine.assessRisks({
      country: "BR",
      riskHint: 78,
      validated: true,
    });
    assert.ok(["critical", "high", "medium"].includes(risks.complianceRecords[0]!.riskLevel));

    const recommendations = engine.recommendCompliance({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("rce-rec-"));
    assert.equal(recommendations.recommendations[0]!.certificationClaim, "none");
    assert.equal(recommendations.recommendations[0]!.neverFalselyCertifyCompliance, true);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendRceLog({
      event: "compliance_assessment",
      level: "info",
      details: "api_key=secret-key tax_id=999-88-7777",
    });
    engine.connectRegionalComplianceEngine();
    const logs = getRceLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("999-88-7777")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalComplianceEngine();
    engine.manageCountryRequirements({ country: "CA", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalComplianceRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalComplianceEngine();
    engine.manageCountryRequirements({ country: "a" });
    engine.manageCountryRequirements({ country: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
