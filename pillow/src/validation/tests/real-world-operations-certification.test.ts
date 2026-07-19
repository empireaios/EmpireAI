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
  createMetaAdsIntegration,
  resetMetaAdsIntegrationForTesting,
} from "../../meta-ads-integration/index.js";
import {
  createGoogleAdsIntegration,
  resetGoogleAdsIntegrationForTesting,
} from "../../google-ads-integration/index.js";
import {
  createTikTokAdsIntegration,
  resetTikTokAdsIntegrationForTesting,
} from "../../tiktok-ads-integration/index.js";
import {
  createYouTubeAdsIntegration,
  resetYouTubeAdsIntegrationForTesting,
} from "../../youtube-ads-integration/index.js";
import {
  createSeoIntelligenceEngine,
  resetSeoIntelligenceEngineForTesting,
} from "../../seo-intelligence-engine/index.js";
import {
  createCampaignManagerEngine,
  resetCampaignManagerForTesting,
} from "../../campaign-manager/index.js";
import {
  createAudienceIntelligenceEngine,
  resetAudienceIntelligenceForTesting,
} from "../../audience-intelligence/index.js";
import {
  createAttributionEngine,
  resetAttributionEngineForTesting,
} from "../../attribution-engine/index.js";
import {
  createMarketingAnalyticsDashboard,
  resetMarketingAnalyticsDashboardForTesting,
} from "../../marketing-analytics-dashboard/index.js";
import {
  createAiCampaignGenerator,
  resetAiCampaignGeneratorForTesting,
} from "../../ai-campaign-generator/index.js";
import {
  createBudgetOptimizationEngine,
  resetBudgetOptimizationEngineForTesting,
} from "../../budget-optimization-engine/index.js";
import {
  createConversionIntelligence,
  resetConversionIntelligenceForTesting,
} from "../../conversion-intelligence/index.js";
import {
  createViralTrendIntelligence,
  resetViralTrendIntelligenceForTesting,
} from "../../viral-trend-intelligence/index.js";
import {
  createMarketingExperimentEngine,
  resetMarketingExperimentEngineForTesting,
} from "../../marketing-experiment-engine/index.js";
import {
  createCrossChannelOrchestrator,
  resetCrossChannelOrchestratorForTesting,
} from "../../cross-channel-orchestrator/index.js";
import {
  createAutonomousMarketingEngine,
  resetAutonomousMarketingEngineForTesting,
} from "../../autonomous-marketing-engine/index.js";
import {
  createRealWorldOperationsCertificationEngine,
  resetRealWorldOperationsCertificationForTesting,
  buildRealWorldOperationsCertificationConfiguration,
  REAL_WORLD_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFIED_PROGRAMMES,
  RWOC_METADATA_VERSION,
  RWOC_CAPABILITIES,
  type ProgrammeCertificationProbe,
} from "../../real-world-operations-certification/index.js";
import { appendRwocLog, getRwocLogs } from "../../real-world-operations-certification/rwoc-logging.js";

function mockProgrammeCert(
  missionId: string,
  overall: "certified" | "partial" | "failed" | "pending" = "certified",
): ProgrammeCertificationProbe {
  return {
    getState: () => ({
      missionId,
      status: "active",
      health: { status: "healthy", healthScore: 95 },
      latestReport: {
        overallCertificationStatus: overall,
        certificationId: `${missionId.toLowerCase()}-cert-mock`,
      },
    }),
    getLatestReport: () => ({
      overallCertificationStatus: overall,
      certificationId: `${missionId.toLowerCase()}-cert-mock`,
      evidenceReferences: [`mock:${missionId}`],
    }),
  };
}

async function buildEngine(
  configOverrides?: Parameters<typeof buildRealWorldOperationsCertificationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mfw = createMarketingFrameworkEngine(bootstrap);
  await mfw.initialize();

  const meta = createMetaAdsIntegration(bootstrap, mfw);
  await meta.initialize();
  meta.connectMetaAds();
  const google = createGoogleAdsIntegration(bootstrap, mfw);
  await google.initialize();
  google.connectGoogleAds();
  const tiktok = createTikTokAdsIntegration(bootstrap, mfw);
  await tiktok.initialize();
  tiktok.connectTikTokAds();
  const youtube = createYouTubeAdsIntegration(bootstrap, mfw, google);
  await youtube.initialize();
  youtube.connectYouTubeAds();
  const seo = createSeoIntelligenceEngine(bootstrap, mfw, null);
  await seo.initialize();
  seo.connectSeoEngine();

  const campaignManager = createCampaignManagerEngine(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
  });
  await campaignManager.initialize();
  campaignManager.connectCampaignManager();

  const audience = createAudienceIntelligenceEngine(bootstrap, {
    marketingFramework: mfw,
    customerSegmentation: null,
    customerJourney: null,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    campaignManager,
  });
  await audience.initialize();
  audience.connectAudienceIntelligence();

  const attribution = createAttributionEngine(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    campaignManager,
    audienceIntelligence: audience,
  });
  await attribution.initialize();
  attribution.connectAttributionEngine();

  const dashboard = createMarketingAnalyticsDashboard(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
  });
  await dashboard.initialize();
  dashboard.connectDashboard();

  const aiCampaigns = createAiCampaignGenerator(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    creativeAssetManager: null,
  });
  await aiCampaigns.initialize();
  aiCampaigns.connectAiCampaignGenerator();

  const budget = createBudgetOptimizationEngine(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    aiCampaignGenerator: aiCampaigns,
  });
  await budget.initialize();
  budget.connectBudgetOptimization();

  const conversion = createConversionIntelligence(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    aiCampaignGenerator: aiCampaigns,
    budgetOptimizationEngine: budget,
  });
  await conversion.initialize();
  conversion.connectConversionIntelligence();

  const viral = createViralTrendIntelligence(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    audienceIntelligence: audience,
    marketingAnalyticsDashboard: dashboard,
    competitorMarketingMonitor: null,
  });
  await viral.initialize();
  viral.connectViralTrendIntelligence();

  const experiments = createMarketingExperimentEngine(bootstrap, {
    marketingFramework: mfw,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    aiCampaignGenerator: aiCampaigns,
    budgetOptimizationEngine: budget,
    conversionIntelligence: conversion,
    viralTrendIntelligence: viral,
  });
  await experiments.initialize();
  experiments.connectMarketingExperimentEngine();

  const orchestrator = createCrossChannelOrchestrator(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    aiCampaignGenerator: aiCampaigns,
    budgetOptimizationEngine: budget,
    conversionIntelligence: conversion,
    competitorMarketingMonitor: null,
    viralTrendIntelligence: viral,
    marketingExperimentEngine: experiments,
  });
  await orchestrator.initialize();
  orchestrator.connectCrossChannelOrchestrator();

  const ame = createAutonomousMarketingEngine(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    creativeAssetManager: null,
    aiCampaignGenerator: aiCampaigns,
    budgetOptimizationEngine: budget,
    conversionIntelligence: conversion,
    competitorMarketingMonitor: null,
    viralTrendIntelligence: viral,
    marketingExperimentEngine: experiments,
    crossChannelOrchestrator: orchestrator,
  });
  await ame.initialize();
  ame.connectAutonomousMarketingEngine();

  const engine = createRealWorldOperationsCertificationEngine(
    bootstrap,
    {
      marketplaceCertification: mockProgrammeCert("R1-15"),
      supplierOperationsCertification: mockProgrammeCert("R2-20"),
      financialOperationsCertification: mockProgrammeCert("R3-18"),
      customerOperationsCertification: mockProgrammeCert("R4-19"),
      marketingFramework: mfw,
      campaignManager,
      crossChannelOrchestrator: orchestrator,
      autonomousMarketingEngine: ame,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-20 Real World Operations Certification", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetTikTokAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
    resetSeoIntelligenceEngineForTesting();
    resetCampaignManagerForTesting();
    resetAudienceIntelligenceForTesting();
    resetAttributionEngineForTesting();
    resetMarketingAnalyticsDashboardForTesting();
    resetAiCampaignGeneratorForTesting();
    resetBudgetOptimizationEngineForTesting();
    resetConversionIntelligenceForTesting();
    resetViralTrendIntelligenceForTesting();
    resetMarketingExperimentEngineForTesting();
    resetCrossChannelOrchestratorForTesting();
    resetAutonomousMarketingEngineForTesting();
    resetRealWorldOperationsCertificationForTesting();
  });

  test("buildRealWorldOperationsCertificationConfiguration loads defaults", () => {
    const config = buildRealWorldOperationsCertificationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.safeTestMode, true);
    assert.equal(config.neverModifyProductionOperationsUnlessSafeTestMode, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(RWOC_CAPABILITIES.includes("certification_reporting"));
    assert.equal(CERTIFIED_PROGRAMMES.length, 5);
  });

  test("engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RWOC-001");
    assert.equal(state.missionId, "R5-20");
    assert.ok(REAL_WORLD_OPERATIONS_CERTIFICATION_SYSTEM_PATH.includes("REAL_WORLD"));
  });

  test("full certification produces machine-readable rwoc-* report", async () => {
    const { engine } = await buildEngine();
    const report = await engine.runRealWorldOperationsCertification({ validated: true });
    assert.ok(report.certificationId.startsWith("rwoc-cert-"));
    assert.equal(report.metadataVersion, RWOC_METADATA_VERSION);
    assert.equal(report.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    assert.equal(report.productionMutationAttempted, false);
    assert.equal(report.marketplaceCertificationStatus, "certified");
    assert.equal(report.supplierCertificationStatus, "certified");
    assert.equal(report.fulfilmentCertificationStatus, "certified");
    assert.equal(report.financialCertificationStatus, "certified");
    assert.equal(report.customerCertificationStatus, "certified");
    assert.equal(report.marketingCertificationStatus, "certified");
    assert.equal(report.endToEndWorkflowResult, "pass");
    assert.equal(report.crossProgrammeIntegrationResult, "pass");
    assert.ok(report.operationalReadinessScore >= 80);
    assert.equal(report.autonomousOperationalReadiness, true);
    assert.equal(report.overallCertificationStatus, "certified");
    assert.ok(report.evidenceReferences.includes("governance:grand-king"));
  });

  test("rejects unvalidated certification run", async () => {
    const { engine } = await buildEngine();
    const report = await engine.runRealWorldOperationsCertification({ validated: false });
    assert.equal(report.overallCertificationStatus, "failed");
    assert.ok(report.errors.some((e) => e.toLowerCase().includes("validation")));
  });

  test("missing programmes degrade certification", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createRealWorldOperationsCertificationEngine(bootstrap, {
      marketplaceCertification: null,
      supplierOperationsCertification: null,
      financialOperationsCertification: null,
      customerOperationsCertification: null,
      marketingFramework: null,
      campaignManager: null,
      crossChannelOrchestrator: null,
      autonomousMarketingEngine: null,
    });
    await engine.initialize();
    const report = await engine.runRealWorldOperationsCertification({ validated: true });
    assert.equal(report.overallCertificationStatus, "failed");
    assert.equal(report.autonomousOperationalReadiness, false);
    assert.ok(report.programmeResults.every((p) => p.status === "fail"));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendRwocLog({
      event: "programme_validation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.runRealWorldOperationsCertification({ validated: true });
    const logs = getRwocLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables safe-test or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      safeTestMode: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyProductionOperationsUnlessSafeTestMode: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.safeTestMode, true);
    assert.equal(config.neverModifyProductionOperationsUnlessSafeTestMode, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    await engine.runRealWorldOperationsCertification({ validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.overallCertificationStatus, "certified");
    assert.ok((cockpit.operationalReadinessScore ?? 0) >= 80);
    assert.equal(cockpit.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
  });

  test("repeated certification runs remain stable", async () => {
    const { engine } = await buildEngine();
    const first = await engine.runRealWorldOperationsCertification({ validated: true });
    const second = await engine.runRealWorldOperationsCertification({ validated: true });
    assert.equal(first.overallCertificationStatus, "certified");
    assert.equal(second.overallCertificationStatus, "certified");
    assert.notEqual(first.certificationId, second.certificationId);
    assert.equal(engine.getState().performance.certificationRuns, 2);
  });
});
