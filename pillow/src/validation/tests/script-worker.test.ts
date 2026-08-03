import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CONTENT_FORMATS,
  SCW_CAPABILITIES,
  SCW_INTEGRATION_TARGETS,
  SCW_METADATA_VERSION,
  SCW_REPORT_VERSION,
  buildScriptWorkerConfiguration,
  createScriptWorker,
  resetScriptWorkerForTesting,
} from "../../script-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createScriptWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createScriptWorker(bootstrap, config);
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
  pillowGovernanceConfirmed: true,
  validated: true,
};

const topicPlanInput = {
  topicPlanId: "tpw-pln-001",
  topicId: "topic-ai-productivity-01",
  topicTitle: "AI productivity tools for founders",
  contentFormat: "explainer" as const,
};

const fullScriptInput = { ...editorialInput, ...topicPlanInput };

describe("Q4-05 Script Worker", () => {
  beforeEach(resetScriptWorkerForTesting);

  test("1 locks mandatory script-worker boundaries", () => {
    const c = buildScriptWorkerConfiguration(REPO_ROOT, {
      neverGenerateVisuals: false as never,
      neverGenerateVoiceovers: false as never,
      neverAssembleVideos: false as never,
      neverPublishContent: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ406OrLater: false as never,
      followApprovedTopicPlan: false as never,
      followEditorInChiefStrategy: false as never,
    });
    assert.equal(c.neverGenerateVisuals, true);
    assert.equal(c.neverGenerateVoiceovers, true);
    assert.equal(c.neverAssembleVideos, true);
    assert.equal(c.neverPublishContent, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ406OrLater, true);
    assert.equal(c.followApprovedTopicPlan, true);
    assert.equal(c.followEditorInChiefStrategy, true);
  });

  test("2 initializes PILLOW-SCW-001 for Q4-05 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-05");
    assert.equal(state.engineVersion, "PILLOW-SCW-001");
    assert.equal(state.configuration.workerId, "wkr-script-01");
    for (const target of SCW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const format of CONTENT_FORMATS) {
      assert.ok(typeof format === "string");
    }
    assert.ok(SCW_CAPABILITIES.includes("generate_complete_scripts"));
  });

  test("3 receives topic plan", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    const report = engine.receiveApprovedTopicPlan(topicPlanInput);
    assert.equal(report.action, "receive_approved_topic_plan");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(engine.getEngineRecord());
  });

  test("4 generates script following editorial strategy", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveApprovedTopicPlan(topicPlanInput);
    const report = engine.generateCompleteScript(fullScriptInput);
    assert.equal(report.action, "generate_complete_script");
    assert.notEqual(report.validation.decision, "fail");
    const script = report.latestScript!;
    assert.ok(script.narrationReadyText.toLowerCase().includes("founder"));
    assert.equal(script.followEditorInChiefStrategy, true);
    assert.equal(script.followApprovedTopicPlan, true);
  });

  test("5 supports multiple content formats (at least short + long_form_video + explainer)", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    const formats = [
      { ...topicPlanInput, contentFormat: "short" as const, topicTitle: "Quick short on AI tools" },
      {
        ...topicPlanInput,
        contentFormat: "long_form_video" as const,
        topicTitle: "Long form deep dive on AI productivity",
      },
      { ...topicPlanInput, contentFormat: "explainer" as const, topicTitle: "Explainer: AI workflows" },
    ];
    for (const input of formats) {
      engine.receiveApprovedTopicPlan(input);
      const report = engine.generateCompleteScript({ ...fullScriptInput, ...input });
      assert.notEqual(report.validation.decision, "fail");
      assert.equal(report.latestScript!.contentFormat, input.contentFormat);
    }
  });

  test("6 structures intro/body/conclusion", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveApprovedTopicPlan(topicPlanInput);
    const report = engine.generateCompleteScript(fullScriptInput);
    const sections = report.latestScript!.scriptSections;
    const types = sections.map((s) => s.sectionType);
    assert.ok(types.some((t) => t === "intro" || t === "hook"));
    assert.ok(types.some((t) => t === "body" || t === "list_item"));
    assert.ok(types.some((t) => t === "conclusion" || t === "cta"));
    for (const section of sections) {
      assert.ok(section.narration.trim().length > 0);
      assert.ok(section.estimatedSeconds > 0);
    }
  });

  test("7 self-review completed", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveApprovedTopicPlan(topicPlanInput);
    engine.generateCompleteScript(fullScriptInput);
    const review = engine.selfReviewScript(fullScriptInput);
    assert.equal(review.action, "self_review_script");
    assert.notEqual(review.validation.decision, "fail");
    const script = review.latestScript!;
    assert.ok(script.selfReviewSummary);
    assert.ok(script.selfReviewPassed);
    assert.ok(script.confidenceScore >= 60);
  });

  test("8 produces Script Report with all required fields", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveApprovedTopicPlan(topicPlanInput);
    const report = engine.produceScriptReport(fullScriptInput);
    const script = report.latestScript!;
    assert.ok(script.scriptId.startsWith("scw-scr-"));
    assert.ok(script.timestamp);
    assert.equal(script.channelId, "chn-youtube-insights-01");
    assert.equal(script.topicId, "topic-ai-productivity-01");
    assert.ok(script.scriptTitle);
    assert.ok(script.scriptSections.length >= 3);
    assert.ok(script.estimatedDuration > 0);
    assert.ok(script.editorialCompliance);
    assert.ok(script.selfReviewSummary);
    assert.ok(script.confidenceScore > 0);
    assert.equal(script.metadataVersion, SCW_METADATA_VERSION);
    assert.equal(script.reportVersion, SCW_REPORT_VERSION);
    assert.equal(script.neverGenerateVisuals, true);
    assert.equal(script.neverGenerateVoiceovers, true);
    assert.equal(script.neverAssembleVideos, true);
    assert.equal(script.neverPublishContent, true);
    assert.ok(script.narrationReadyText.trim().length > 50);
    assert.ok(script.traceabilityRefs.length >= 1);
  });

  test("9 rejects visuals/voiceover/assemble/publish/override/Q4-06", async () => {
    const engine = await build();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveApprovedTopicPlan(topicPlanInput);
    for (const forbidden of [
      { generateVisuals: true },
      { generateVoiceovers: true },
      { assembleVideos: true },
      { publishContent: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ406OrLater: true },
    ] as const) {
      const report = engine.generateCompleteScript({
        ...fullScriptInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestScript, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createScriptWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-scw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveEditorialStrategy(editorialInput);
    engine.receiveApprovedTopicPlan(topicPlanInput);
    const produced = engine.produceScriptReport(fullScriptInput);
    const listed = engine.list();
    assert.ok(listed.scripts.length >= 1);
    const submitted = engine.submitReport({
      scriptId: produced.latestScript!.scriptId,
      validated: true,
      pillowGovernanceConfirmed: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-05"]);
    assert.equal(submitted.latestScript!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestScript!.executiveReportId, "ert-worker-scw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-05");
    assert.equal(cockpit.neverGenerateVisuals, true);
    assert.equal(cockpit.neverPublishContent, true);
  });
});
