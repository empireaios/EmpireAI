import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ALIGNMENT_LEVELS,
  CADENCE_STATUSES,
  CONTENT_MIX,
  TOPIC_PLAN_VERSION,
  TOPIC_PRIORITIES,
  TPW_CAPABILITIES,
  TPW_INTEGRATION_TARGETS,
  TPW_METADATA_VERSION,
  buildTopicPlannerWorkerConfiguration,
  createTopicPlannerWorker,
  resetTopicPlannerWorkerForTesting,
} from "../../topic-planner-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createTopicPlannerWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createTopicPlannerWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const editorialInput = {
  channelId: "chn-youtube-insights-01",
  mediaBusinessId: "mbiz-media-insights-01",
  editorialStrategy: "Authoritative insights for founders scaling AI products",
  channelIdentity: "Founder-focused AI productivity channel",
  targetAudience: "Startup founders and product leaders",
  editorialTone: "authoritative",
  contentPriorities: ["AI productivity", "founder scaling", "automation workflows"],
  editorialReportId: "ecw-rpt-001",
  channelObjectives: ["grow subscriber base", "increase watch time"],
  pillowGovernanceConfirmed: true,
  validated: true,
};

const trendInput = {
  trendReports: [
    {
      trendReportId: "trw-trd-001",
      trendTopic: "AI productivity tools for founders",
      confidenceScore: 82,
      recommendedPriority: "high",
      trendDirection: "emerging",
    },
    {
      trendReportId: "trw-trd-002",
      trendTopic: "No-code automation for startups",
      confidenceScore: 74,
      recommendedPriority: "medium",
      trendDirection: "stable",
    },
  ],
  candidateTopics: [
    { title: "Evergreen founder mindset guide", contentMix: "evergreen" as const },
    { title: "Weekly AI tool roundup", contentMix: "trending" as const },
    { title: "Hybrid scaling playbook", contentMix: "hybrid" as const },
  ],
  dailyTopicCount: 3,
  evergreenRatio: 0.4,
  publishingDate: "2026-08-01",
};

const fullPlanningInput = { ...editorialInput, ...trendInput };

describe("Q4-04 Topic Planner Worker", () => {
  beforeEach(resetTopicPlannerWorkerForTesting);

  test("1 locks mandatory topic-planner-worker boundaries", () => {
    const c = buildTopicPlannerWorkerConfiguration(REPO_ROOT, {
      neverWriteScripts: false as never,
      neverGenerateVisuals: false as never,
      neverProduceVideos: false as never,
      neverPublishContent: false as never,
      neverBypassPillowGovernance: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ405OrLater: false as never,
      neverRequireGrandKingDailyPrompts: false as never,
      followEditorInChiefStrategy: false as never,
      useTrendResearchEvidence: false as never,
    });
    assert.equal(c.neverWriteScripts, true);
    assert.equal(c.neverGenerateVisuals, true);
    assert.equal(c.neverProduceVideos, true);
    assert.equal(c.neverPublishContent, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ405OrLater, true);
    assert.equal(c.neverRequireGrandKingDailyPrompts, true);
    assert.equal(c.followEditorInChiefStrategy, true);
    assert.equal(c.useTrendResearchEvidence, true);
  });

  test("2 initializes PILLOW-TPW-001 for Q4-04 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-04");
    assert.equal(state.engineVersion, "PILLOW-TPW-001");
    assert.equal(state.configuration.workerId, "wkr-topic-planner-01");
    for (const target of TPW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const priority of TOPIC_PRIORITIES) {
      assert.ok(typeof priority === "string");
    }
    for (const mix of CONTENT_MIX) {
      assert.ok(typeof mix === "string");
    }
    for (const cadence of CADENCE_STATUSES) {
      assert.ok(typeof cadence === "string");
    }
    for (const alignment of ALIGNMENT_LEVELS) {
      assert.ok(typeof alignment === "string");
    }
    assert.ok(TPW_CAPABILITIES.includes("select_daily_publishing_topics"));
  });

  test("3 receives editorial strategy", async () => {
    const engine = await build();
    const report = engine.receiveEditorialStrategy(editorialInput);
    assert.equal(report.action, "receive_editorial_strategy");
    assert.notEqual(report.validation.decision, "fail");
    const ctx = engine.getEngineRecord();
    assert.ok(ctx);
  });

  test("4 receives and analyses trend research", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    const trend = engine.receiveTrendResearchReports(trendInput);
    assert.equal(trend.action, "receive_trend_research_reports");
    assert.notEqual(trend.validation.decision, "fail");
    const analysis = engine.analyseChannelObjectives({
      ...fullPlanningInput,
      channelObjectives: ["grow subscriber base", "increase watch time"],
    });
    assert.equal(analysis.action, "analyse_channel_objectives");
    assert.notEqual(analysis.validation.decision, "fail");
  });

  test("5 selects daily topics", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveTrendResearchReports(trendInput);
    const report = engine.selectDailyPublishingTopics(fullPlanningInput);
    assert.equal(report.action, "select_daily_publishing_topics");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.latestTopicPlan!.selectedTopics.length >= 1);
    assert.ok(report.latestTopicPlan!.selectedTopics.length <= 3);
  });

  test("6 assigns topic priorities and ranks", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveTrendResearchReports(trendInput);
    const ranked = engine.rankTopicsByStrategicPriority(fullPlanningInput);
    assert.equal(ranked.action, "rank_topics_by_strategic_priority");
    assert.notEqual(ranked.validation.decision, "fail");
    const plan = ranked.latestTopicPlan!;
    assert.ok(TOPIC_PRIORITIES.includes(plan.topicPriority));
    assert.ok(plan.rankedTopics.length >= plan.selectedTopics.length);
    for (const topic of plan.selectedTopics) {
      assert.ok(TOPIC_PRIORITIES.includes(topic.priority));
    }
  });

  test("7 maintains publishing cadence and balances evergreen/trending", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveTrendResearchReports(trendInput);
    const balanced = engine.balanceEvergreenAndTrending(fullPlanningInput);
    assert.equal(balanced.action, "balance_evergreen_and_trending");
    const plan = balanced.latestTopicPlan!;
    assert.ok(CADENCE_STATUSES.includes(plan.cadenceStatus));
    assert.ok(plan.evergreenCount >= 0);
    assert.ok(plan.trendingCount >= 0);
    assert.equal(plan.evergreenCount + plan.trendingCount, plan.selectedTopics.length);
    const cadence = engine.maintainPublishingCadence(fullPlanningInput);
    assert.equal(cadence.action, "maintain_publishing_cadence");
    assert.ok(cadence.latestTopicPlan!.cadenceStatus);
  });

  test("8 produces Topic Plan with all required fields", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveTrendResearchReports(trendInput);
    const report = engine.produceTopicPlan(fullPlanningInput);
    const plan = report.latestTopicPlan!;
    assert.ok(plan.topicPlanId.startsWith("tpw-pln-"));
    assert.ok(plan.timestamp);
    assert.equal(plan.channelId, "chn-youtube-insights-01");
    assert.equal(plan.publishingDate, "2026-08-01");
    assert.ok(plan.selectedTopics.length >= 1);
    assert.ok(plan.topicPriority);
    assert.ok(plan.selectionReason);
    assert.ok(plan.editorialAlignment);
    assert.ok(plan.trendAlignment);
    assert.ok(plan.expectedAudience);
    assert.ok(plan.confidenceScore > 0);
    assert.equal(plan.metadataVersion, TPW_METADATA_VERSION);
    assert.equal(plan.planVersion, TOPIC_PLAN_VERSION);
    assert.equal(plan.neverWriteScripts, true);
    assert.equal(plan.neverPublishContent, true);
    assert.equal(plan.followEditorInChiefStrategy, true);
    assert.equal(plan.useTrendResearchEvidence, true);
    assert.ok(plan.traceabilityRefs.length >= 1);
    assert.ok(plan.trendReportIds.length >= 1);
  });

  test("9 rejects script/visual/video/publish/override/Q4-05/grand-king-daily-prompt/bypass", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveTrendResearchReports(trendInput);
    for (const forbidden of [
      { writeScripts: true },
      { generateVisuals: true },
      { produceVideos: true },
      { publishContent: true },
      { bypassPillowGovernance: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ405OrLater: true },
      { requireGrandKingDailyPrompt: true },
    ] as const) {
      const report = engine.produceTopicPlan({
        ...fullPlanningInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestTopicPlan, null);
    }
  });

  test("10 lists and submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createTopicPlannerWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-tpw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveTrendResearchReports(trendInput);
    const produced = engine.produceTopicPlan(fullPlanningInput);
    const listed = engine.list();
    assert.ok(listed.topicPlans.length >= 1);
    const submitted = engine.submitPlan({
      topicPlanId: produced.latestTopicPlan!.topicPlanId,
      validated: true,
      pillowGovernanceConfirmed: true,
    });
    assert.equal(submitted.action, "submit_plan");
    assert.deepEqual(submittedIds, ["Q4-04"]);
    assert.equal(submitted.latestTopicPlan!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestTopicPlan!.executiveReportId, "ert-worker-tpw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-04");
    assert.equal(cockpit.neverWriteScripts, true);
    assert.equal(cockpit.neverPublishContent, true);
  });
});
