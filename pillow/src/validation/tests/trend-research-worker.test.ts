import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APPROVED_RESEARCH_SOURCES,
  DEMAND_LEVELS,
  DISCOVERY_SOURCES,
  EVIDENCE_KINDS,
  PRIORITY_LEVELS,
  TRW_CAPABILITIES,
  TRW_INTEGRATION_TARGETS,
  TRW_METADATA_VERSION,
  TREND_CATEGORIES,
  TREND_DIRECTIONS,
  TREND_RESEARCH_REPORT_VERSION,
  buildTrendResearchWorkerConfiguration,
  createTrendResearchWorker,
  resetTrendResearchWorkerForTesting,
} from "../../trend-research-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createTrendResearchWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createTrendResearchWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const sampleInput = {
  channelId: "chn-youtube-insights-01",
  mediaBusinessId: "mbiz-media-insights-01",
  mediaMissionId: "mfc-mbm-insights-01",
  trendCategory: "hybrid" as const,
  trendTopic: "AI productivity tools for founders",
  discoverySource: "google_trends" as const,
  searchDemandScore: 82,
  searchDemandLevel: "high" as const,
  socialSignalScore: 78,
  socialSignalNotes: "Rising TikTok and YouTube mentions",
  competitorActivityScore: 65,
  competitorNotes: "Three competitor channels publishing weekly on topic",
  currentEventRelevanceScore: 55,
  currentEventNotes: "Linked to recent enterprise AI announcements",
  audienceBehaviourScore: 72,
  audienceNotes: "Watch-time and save-rate increasing on related topics",
  trendDirection: "emerging" as const,
  opportunityCategory: "search_social_hybrid",
  supportingEvidence: [
    {
      source: "google_trends",
      claim: "Search interest up 40% week-over-week",
      kind: "fact" as const,
      relatedTopic: "search_demand",
    },
    {
      source: "social_listening",
      claim: "Viral clip potential estimated from engagement velocity",
      kind: "assumption" as const,
      relatedTopic: "social",
    },
  ],
  validated: true,
};

const decliningInput = {
  ...sampleInput,
  searchDemandScore: 25,
  searchDemandLevel: "fading" as const,
  socialSignalScore: 30,
  competitorActivityScore: 20,
  currentEventRelevanceScore: 15,
  audienceBehaviourScore: 28,
  trendDirection: "declining" as const,
};

describe("Q4-03 Trend Research Worker", () => {
  beforeEach(resetTrendResearchWorkerForTesting);

  test("1 locks mandatory trend-research-worker boundaries", () => {
    const c = buildTrendResearchWorkerConfiguration(REPO_ROOT, {
      neverSelectPublishingTopics: false as never,
      neverWriteScripts: false as never,
      neverGenerateThumbnails: false as never,
      neverPublishContent: false as never,
      neverGenerateContentDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ404OrLater: false as never,
      useApprovedResearchSourcesOnly: false as never,
    });
    assert.equal(c.neverSelectPublishingTopics, true);
    assert.equal(c.neverWriteScripts, true);
    assert.equal(c.neverGenerateThumbnails, true);
    assert.equal(c.neverPublishContent, true);
    assert.equal(c.neverGenerateContentDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ404OrLater, true);
    assert.equal(c.useApprovedResearchSourcesOnly, true);
  });

  test("2 initializes PILLOW-TRW-001 for Q4-03 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-03");
    assert.equal(state.engineVersion, "PILLOW-TRW-001");
    assert.equal(state.configuration.workerId, "wkr-trend-research-01");
    for (const target of TRW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const category of TREND_CATEGORIES) {
      assert.ok(typeof category === "string");
    }
    for (const source of DISCOVERY_SOURCES) {
      assert.ok(APPROVED_RESEARCH_SOURCES.includes(source));
    }
    for (const direction of TREND_DIRECTIONS) {
      assert.ok(typeof direction === "string");
    }
    for (const priority of PRIORITY_LEVELS) {
      assert.ok(typeof priority === "string");
    }
    for (const kind of EVIDENCE_KINDS) {
      assert.ok(typeof kind === "string");
    }
    for (const level of DEMAND_LEVELS) {
      assert.ok(typeof level === "string");
    }
    assert.ok(TRW_CAPABILITIES.includes("monitor_search_trends"));
  });

  test("3 monitors search trends", async () => {
    const report = (await build()).monitorSearchTrends(sampleInput);
    assert.equal(report.action, "monitor_search_trends");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestTrendReport!.trendCategory, "search_demand");
    assert.ok(report.latestTrendReport!.searchDemand.score >= 70);
  });

  test("4 monitors competitor channel activity", async () => {
    const report = (await build()).monitorCompetitorChannels(sampleInput);
    assert.equal(report.action, "monitor_competitor_channels");
    assert.equal(report.latestTrendReport!.trendCategory, "competitor");
    assert.ok(report.latestTrendReport!.competitorActivity.score > 0);
  });

  test("5 monitors social platform signals", async () => {
    const report = (await build()).monitorSocialPlatformTrends(sampleInput);
    assert.equal(report.action, "monitor_social_platform_trends");
    assert.equal(report.latestTrendReport!.trendCategory, "social");
    assert.ok(report.latestTrendReport!.socialSignals.score >= 70);
  });

  test("6 monitors current events relevance", async () => {
    const report = (await build()).monitorCurrentEvents(sampleInput);
    assert.equal(report.action, "monitor_current_events");
    assert.equal(report.latestTrendReport!.trendCategory, "current_events");
    assert.ok(report.latestTrendReport!.currentEventRelevance.score > 0);
  });

  test("7 identifies emerging and declining opportunities", async () => {
    const engine = await build();
    const emerging = engine.identifyEmergingTrends(sampleInput);
    const declining = engine.identifyDecliningTrends(decliningInput);
    assert.equal(emerging.latestTrendReport!.trendDirection, "emerging");
    assert.equal(declining.latestTrendReport!.trendDirection, "declining");
    assert.ok(emerging.latestTrendReport!.confidenceScore > declining.latestTrendReport!.confidenceScore);
  });

  test("8 produces Trend Research Report with all required fields", async () => {
    const report = (await build()).produceTrendResearchReport(sampleInput);
    const latest = report.latestTrendReport!;
    assert.ok(latest.trendReportId.startsWith("trw-trd-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.channelId, "chn-youtube-insights-01");
    assert.equal(latest.mediaBusinessId, "mbiz-media-insights-01");
    assert.equal(latest.mediaMissionId, "mfc-mbm-insights-01");
    assert.ok(latest.searchDemand);
    assert.ok(latest.socialSignals);
    assert.ok(latest.competitorActivity);
    assert.ok(latest.currentEventRelevance);
    assert.ok(latest.confidenceScore > 0);
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.ok(latest.supportingEvidence.some((e) => e.kind === "fact"));
    assert.ok(latest.supportingEvidence.some((e) => e.kind === "assumption"));
    assert.equal(latest.metadataVersion, TRW_METADATA_VERSION);
    assert.equal(latest.reportVersion, TREND_RESEARCH_REPORT_VERSION);
    assert.equal(latest.neverGenerateContentDirectly, true);
    assert.equal(latest.neverSelectPublishingTopics, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects topic-select/script/thumbnail/publish/content-gen/override/Q4-04/unapproved source", async () => {
    const engine = await build();
    for (const forbidden of [
      { selectPublishingTopics: true },
      { writeScripts: true },
      { generateThumbnails: true },
      { publishContent: true },
      { generateContent: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ404OrLater: true },
      { useUnapprovedSource: true },
      { discoverySource: "unapproved_scraper" },
    ] as const) {
      const report = engine.produceTrendResearchReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestTrendReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createTrendResearchWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-trw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = engine.produceTrendResearchReport(sampleInput);
    const listed = engine.list();
    assert.ok(listed.trendReports.length >= 1);
    const submitted = engine.submitReport({
      trendReportId: produced.latestTrendReport!.trendReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-03"]);
    assert.equal(submitted.latestTrendReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestTrendReport!.executiveReportId, "ert-worker-trw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-03");
    assert.equal(cockpit.neverGenerateContentDirectly, true);
    assert.equal(cockpit.neverSelectPublishingTopics, true);
  });
});
