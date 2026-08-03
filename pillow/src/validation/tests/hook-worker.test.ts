import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CONTENT_FORMATS,
  HKW_CAPABILITIES,
  HKW_INTEGRATION_TARGETS,
  HKW_METADATA_VERSION,
  HKW_REPORT_VERSION,
  HOOK_TYPES,
  buildHookWorkerConfiguration,
  createHookWorker,
  resetHookWorkerForTesting,
} from "../../hook-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createHookWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createHookWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const scriptInput = {
  scriptId: "scw-scr-001",
  channelId: "chn-youtube-insights-01",
  topicId: "topic-ai-productivity-01",
  contentFormat: "explainer" as const,
  scriptTitle: "AI productivity tools for founders",
  scriptIntent: "Educate startup founders on practical AI workflows without rewriting the approved script",
  targetAudience: "Startup founders and product leaders",
  scriptSections: [
    {
      sectionId: "sec-intro",
      sectionType: "intro",
      heading: "Why AI productivity matters",
      narration: "Founders face mounting pressure to scale output without scaling headcount.",
    },
    {
      sectionId: "sec-body",
      sectionType: "body",
      heading: "Three workflows that work",
      narration: "Automation, delegation, and focused deep work form the core framework.",
    },
    {
      sectionId: "sec-conclusion",
      sectionType: "conclusion",
      heading: "Next steps",
      narration: "Pick one workflow this week and measure the impact on your team.",
    },
  ],
  pillowGovernanceConfirmed: true,
  validated: true,
};

describe("Q4-06 Hook Worker", () => {
  beforeEach(resetHookWorkerForTesting);

  test("1 locks mandatory hook-worker boundaries", () => {
    const c = buildHookWorkerConfiguration(REPO_ROOT, {
      neverRewriteCompleteScript: false as never,
      neverGenerateThumbnails: false as never,
      neverGenerateVideos: false as never,
      neverPublishContent: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ407OrLater: false as never,
      neverUseMisleadingOrDeceptiveHooks: false as never,
      preserveApprovedScriptIntent: false as never,
      generateOriginalHooks: false as never,
    });
    assert.equal(c.neverRewriteCompleteScript, true);
    assert.equal(c.neverGenerateThumbnails, true);
    assert.equal(c.neverGenerateVideos, true);
    assert.equal(c.neverPublishContent, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ407OrLater, true);
    assert.equal(c.neverUseMisleadingOrDeceptiveHooks, true);
    assert.equal(c.preserveApprovedScriptIntent, true);
    assert.equal(c.generateOriginalHooks, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-HKW-001 for Q4-06 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-06");
    assert.equal(state.engineVersion, "PILLOW-HKW-001");
    assert.equal(state.configuration.workerId, "wkr-hook-01");
    assert.equal(state.configuration.role, "role-creator-hook-worker");
    for (const target of HKW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const format of CONTENT_FORMATS) {
      assert.ok(typeof format === "string");
    }
    for (const hookType of HOOK_TYPES) {
      assert.ok(typeof hookType === "string");
    }
    assert.ok(HKW_CAPABILITIES.includes("generate_opening_hooks"));
    assert.ok(HKW_CAPABILITIES.includes("produce_machine_readable_hook_reports"));
  });

  test("3 receives approved script", async () => {
    const engine = await build();
    const report = engine.receiveApprovedScript(scriptInput);
    assert.equal(report.action, "receive_approved_script");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(engine.getEngineRecord());
  });

  test("4 generates multiple hooks", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.generateOpeningHooks(scriptInput);
    assert.equal(report.action, "generate_opening_hooks");
    assert.notEqual(report.validation.decision, "fail");
    const hookReport = report.latestHookReport!;
    assert.ok(hookReport.primaryHook.text.trim().length > 0);
    assert.ok(hookReport.primaryHook.hookType);
    assert.ok(hookReport.alternativeHooks.length >= 2);
    const altTypes = new Set(hookReport.alternativeHooks.map((h) => h.hookType));
    assert.ok(altTypes.size >= 2, "alternatives should use different hook types");
  });

  test("5 generates curiosity gaps", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.generateCuriosityGaps(scriptInput);
    assert.equal(report.action, "generate_curiosity_gaps");
    assert.notEqual(report.validation.decision, "fail");
    const gaps = report.latestHookReport!.curiosityGaps;
    assert.ok(gaps.length >= 2);
    for (const gap of gaps) {
      assert.ok(gap.gapId);
      assert.ok(gap.text.trim().length > 0);
      assert.ok(gap.placement);
    }
  });

  test("6 generates retention loops", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.generateRetentionLoops(scriptInput);
    assert.equal(report.action, "generate_retention_loops");
    assert.notEqual(report.validation.decision, "fail");
    const loops = report.latestHookReport!.retentionLoops;
    assert.ok(loops.length >= 2);
    for (const loop of loops) {
      assert.ok(loop.loopId);
      assert.ok(loop.text.trim().length > 0);
      assert.ok(loop.placement);
    }
  });

  test("7 self-review completed", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    engine.produceHookReport(scriptInput);
    const review = engine.selfReviewHookEffectiveness(scriptInput);
    assert.equal(review.action, "self_review_hook_effectiveness");
    assert.notEqual(review.validation.decision, "fail");
    const hookReport = review.latestHookReport!;
    assert.ok(hookReport.selfReviewSummary);
    assert.ok(hookReport.selfReviewPassed);
    assert.ok(hookReport.confidenceScore >= 60);
  });

  test("8 produces Hook Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.produceHookReport(scriptInput);
    const hookReport = report.latestHookReport!;
    assert.ok(hookReport.hookReportId.startsWith("hkw-rpt-"));
    assert.ok(hookReport.timestamp);
    assert.equal(hookReport.scriptId, "scw-scr-001");
    assert.equal(hookReport.channelId, "chn-youtube-insights-01");
    assert.equal(hookReport.topicId, "topic-ai-productivity-01");
    assert.equal(hookReport.contentFormat, "explainer");
    assert.ok(hookReport.primaryHook.hookId);
    assert.ok(hookReport.primaryHook.hookType);
    assert.ok(hookReport.primaryHook.text);
    assert.ok(hookReport.primaryHook.placement);
    assert.ok(hookReport.alternativeHooks.length >= 2);
    assert.ok(hookReport.curiosityGaps.length >= 2);
    assert.ok(hookReport.retentionLoops.length >= 2);
    assert.ok(hookReport.continuationMoments.length >= 2);
    assert.ok(hookReport.pacingRecommendations.length >= 1);
    assert.ok(hookReport.engagementRationale);
    assert.ok(hookReport.selfReviewSummary);
    assert.ok(hookReport.confidenceScore > 0);
    assert.equal(hookReport.metadataVersion, HKW_METADATA_VERSION);
    assert.equal(hookReport.reportVersion, HKW_REPORT_VERSION);
    assert.equal(hookReport.neverRewriteCompleteScript, true);
    assert.equal(hookReport.neverGenerateThumbnails, true);
    assert.equal(hookReport.neverGenerateVideos, true);
    assert.equal(hookReport.neverPublishContent, true);
    assert.equal(hookReport.neverOverridePillow, true);
    assert.equal(hookReport.neverOverrideGrandKing, true);
    assert.equal(hookReport.neverImplementQ407OrLater, true);
    assert.equal(hookReport.neverUseMisleadingOrDeceptiveHooks, true);
    assert.equal(hookReport.preserveApprovedScriptIntent, true);
    assert.equal(hookReport.generateOriginalHooks, true);
    assert.ok(hookReport.traceabilityRefs.length >= 1);
    assert.ok(hookReport.preservedDecisions.length >= 1);
  });

  test("9 rejects rewrite/thumbnail/video/publish/override/Q4-07/misleading", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    for (const forbidden of [
      { rewriteCompleteScript: true },
      { generateThumbnails: true },
      { generateVideos: true },
      { publishContent: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ407OrLater: true },
      { useMisleadingHooks: true },
    ] as const) {
      const report = engine.produceHookReport({
        ...scriptInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestHookReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createHookWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-hkw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedScript(scriptInput);
    const produced = engine.produceHookReport(scriptInput);
    const listed = engine.list();
    assert.ok(listed.hookReports.length >= 1);
    const submitted = engine.submitReport({
      hookReportId: produced.latestHookReport!.hookReportId,
      validated: true,
      pillowGovernanceConfirmed: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-06"]);
    assert.equal(submitted.latestHookReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestHookReport!.executiveReportId, "ert-worker-hkw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-06");
    assert.equal(cockpit.neverRewriteCompleteScript, true);
    assert.equal(cockpit.neverPublishContent, true);
  });
});
