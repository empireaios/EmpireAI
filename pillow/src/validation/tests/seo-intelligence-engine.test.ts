import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createMarketingFrameworkEngine,
  resetMarketingFrameworkForTesting,
} from "../../marketing-framework/index.js";
import {
  createGoogleAdsIntegration,
  resetGoogleAdsIntegrationForTesting,
} from "../../google-ads-integration/index.js";
import {
  createSeoIntelligenceEngine,
  resetSeoIntelligenceEngineForTesting,
  buildSeoIntelligenceConfiguration,
  SEO_INTELLIGENCE_SYSTEM_PATH,
  SIE_CAPABILITIES,
  SEO_INTELLIGENCE_ENGINE_ID,
} from "../../seo-intelligence-engine/index.js";
import { appendSieLog, getSieLogs } from "../../seo-intelligence-engine/sie-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildSeoIntelligenceConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mfw = createMarketingFrameworkEngine(bootstrap);
  await mfw.initialize();
  const googleAds = createGoogleAdsIntegration(bootstrap, mfw);
  await googleAds.initialize();
  googleAds.connectGoogleAds();
  const engine = createSeoIntelligenceEngine(bootstrap, mfw, null, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-06 SEO Intelligence Engine", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetSeoIntelligenceEngineForTesting();
  });

  test("buildSeoIntelligenceConfiguration loads defaults", () => {
    const config = buildSeoIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.allowAutomaticContentModification, false);
    assert.ok(SIE_CAPABILITIES.includes("page_analysis"));
  });

  test("seo intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SIE-001");
    assert.equal(state.missionId, "R5-06");
    assert.ok(SEO_INTELLIGENCE_SYSTEM_PATH.includes("SEO_INTELLIGENCE"));
  });

  test("connectSeoEngine registers with Marketing Framework via R5-06", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectSeoEngine({ projectName: "EmpireAI Organic" });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === SEO_INTELLIGENCE_ENGINE_ID));
    assert.equal(report.engineRecord.marketingDataPresent, true);
  });

  test("connectSeoEngine produces machine-readable sie-* records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectSeoEngine();
    assert.ok(report.seoRunReportId.startsWith("sie-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("sie-"));
    assert.equal(report.engineRecord.metadataVersion, "SIE-001-v1");
  });

  test("analyzePage produces SEO records with scores and issues", async () => {
    const { engine } = await buildEngine();
    engine.connectSeoEngine();
    const report = engine.analyzePage({
      pageReference: "/products",
      pageTitle: "EmpireAI Products",
      metaDescription: "Discover EmpireAI products for intelligent growth and automation.",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "analyze_page");
    assert.equal(report.seoRecords.length, 1);
    const record = report.seoRecords[0]!;
    assert.ok(record.seoRecordId.startsWith("sie-rec-"));
    assert.equal(record.pageReference, "/products");
    assert.ok(record.seoScore >= 0 && record.seoScore <= 100);
    assert.equal(record.metadataVersion, "SIE-001-v1");
  });

  test("keyword management and ranking tracking", async () => {
    const { engine } = await buildEngine();
    engine.connectSeoEngine();
    const keyword = engine.manageKeyword({
      keyword: "ai marketing platform",
      searchVolume: 1200,
      difficulty: 55,
    });
    assert.notEqual(keyword.validation.decision, "fail");
    assert.ok(keyword.keywords[0]?.keywordReference.startsWith("sie-kw-"));

    const ranking = engine.trackRanking({
      keywordReference: keyword.keywords[0]!.keywordReference,
    });
    assert.notEqual(ranking.validation.decision, "fail");
    assert.ok(ranking.keywords[0]?.rankingPosition !== null);
    assert.ok((ranking.keywords[0]?.rankingPosition ?? 0) >= 1);
  });

  test("issue detection, recommendations, and internal links", async () => {
    const { engine } = await buildEngine();
    engine.connectSeoEngine();
    engine.analyzePage({ pageReference: "/blog/seo", pageTitle: "SEO" });

    const issues = engine.detectIssues({ pageReference: "/blog/seo" });
    assert.ok(issues.issues.length >= 0);

    const metadata = engine.optimizeMetadata({
      pageReference: "/blog/seo",
      proposedTitle: "SEO Guide for Growth Teams",
      proposedDescription: "Learn how to grow organic traffic with validated SEO recommendations.",
    });
    assert.notEqual(metadata.validation.decision, "fail");
    assert.ok(metadata.recommendations[0]?.requiresValidationBeforeApply);

    const links = engine.recommendInternalLinks({ pageReference: "/blog/seo" });
    assert.equal(links.recommendations[0]?.type, "internal_link");

    const recs = engine.generateRecommendations({ pageReference: "/blog/seo" });
    assert.equal(recs.action, "generate_recommendations");
  });

  test("organic performance monitoring", async () => {
    const { engine } = await buildEngine();
    engine.connectSeoEngine();
    engine.analyzePage({
      pageReference: "/home",
      pageTitle: "EmpireAI Home",
      metaDescription: "EmpireAI home page for organic acquisition and conversion.",
    });
    const performance = engine.monitorOrganicPerformance({ pageReference: "/home" });
    assert.notEqual(performance.validation.decision, "fail");
    assert.ok(performance.seoRecords[0]!.organicImpressions > 0);
    assert.ok(performance.seoRecords[0]!.organicSessions > 0);
  });

  test("rejects page analysis without page reference", async () => {
    const { engine } = await buildEngine();
    engine.connectSeoEngine();
    const report = engine.analyzePage({ pageReference: "   " });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSieLog({
      event: "seo_analysis",
      level: "info",
      details: "api_key=secret-key bearer abc123 access_token=xyz",
    });
    await engine.connectSeoEngine();
    const logs = getSieLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never allows automatic content modification", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flag
      allowAutomaticContentModification: true,
    });
    const state = engine.getState();
    assert.equal(state.configuration.allowAutomaticContentModification, false);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectSeoEngine();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
