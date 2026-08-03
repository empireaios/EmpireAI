import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APPROVAL_STATUSES,
  BRAND_CONSISTENCY,
  CONTENT_STANDARD_CATEGORIES,
  ECW_CAPABILITIES,
  ECW_INTEGRATION_TARGETS,
  ECW_METADATA_VERSION,
  EDITORIAL_REPORT_VERSION,
  EDITORIAL_TONES,
  REVIEW_OUTCOMES,
  buildEditorInChiefWorkerConfiguration,
  createEditorInChiefWorker,
  resetEditorInChiefWorkerForTesting,
} from "../../editor-in-chief-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createEditorInChiefWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEditorInChiefWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const sampleInput = {
  mediaBusinessId: "mbiz-media-insights-01",
  channelId: "chn-youtube-insights-01",
  channelName: "Empire Insights",
  mediaMissionId: "mfc-mbm-insights-01",
  editorialStrategy: "Deliver authoritative media analysis for executive audiences",
  channelIdentity: "Trusted executive media intelligence channel",
  targetAudience: "Founders and operators seeking strategic media insights",
  editorialTone: "authoritative" as const,
  qualityStandards: [
    "Verify factual accuracy before downstream production",
    "Maintain brand-safe tone alignment",
  ],
  contentPriorities: ["editorial_quality", "audience_trust", "brand_consistency"],
  contentReviewNotes: "Content aligns with editorial standards",
  brandSignals: ["on-brand", "consistent voice"],
  longTermStrategy: "Build durable editorial authority over 24 months",
  reviewOutcome: "approved" as const,
  executiveRecommendations: [
    "Direct script and production workers using editorial priorities only",
  ],
  approvalDecision: "approved" as const,
  pillowGovernanceConfirmed: true,
  validated: true,
};

describe("Q4-02 Editor-in-Chief Worker", () => {
  beforeEach(resetEditorInChiefWorkerForTesting);

  test("1 locks mandatory editor-in-chief-worker boundaries", () => {
    const c = buildEditorInChiefWorkerConfiguration(REPO_ROOT, {
      neverWriteScripts: false as never,
      neverCreateThumbnails: false as never,
      neverAssembleVideos: false as never,
      neverPublishContent: false as never,
      neverBypassPillowGovernance: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ403OrLater: false as never,
    });
    assert.equal(c.neverWriteScripts, true);
    assert.equal(c.neverCreateThumbnails, true);
    assert.equal(c.neverAssembleVideos, true);
    assert.equal(c.neverPublishContent, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ403OrLater, true);
  });

  test("2 initializes PILLOW-ECW-001 for Q4-02 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-02");
    assert.equal(state.engineVersion, "PILLOW-ECW-001");
    assert.equal(state.configuration.workerId, "wkr-editor-in-chief-01");
    for (const target of ECW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const tone of EDITORIAL_TONES) {
      assert.ok(typeof tone === "string");
    }
    for (const outcome of REVIEW_OUTCOMES) {
      assert.ok(typeof outcome === "string");
    }
    for (const status of BRAND_CONSISTENCY) {
      assert.ok(typeof status === "string");
    }
    for (const status of APPROVAL_STATUSES) {
      assert.ok(typeof status === "string");
    }
    for (const category of CONTENT_STANDARD_CATEGORIES) {
      assert.ok(typeof category === "string");
    }
    assert.ok(ECW_CAPABILITIES.includes("manage_editorial_direction"));
  });

  test("3 creates editorial strategy / manage direction", async () => {
    const engine = await build();
    const direction = engine.manageEditorialDirection(sampleInput);
    assert.equal(direction.action, "manage_editorial_direction");
    assert.equal(direction.validation.decision, "pass");
    assert.ok(direction.validation.warnings.some((w) => w.includes("editorial_direction")));
  });

  test("4 defines target audience", async () => {
    const engine = await build();
    const audience = engine.defineTargetAudience(sampleInput);
    assert.equal(audience.action, "define_target_audience");
    assert.equal(audience.validation.decision, "pass");
    assert.ok(audience.validation.warnings.some((w) => w.includes("target_audience")));
  });

  test("5 defines editorial tone", async () => {
    const engine = await build();
    const tone = engine.defineEditorialTone(sampleInput);
    assert.equal(tone.action, "define_editorial_tone");
    assert.equal(tone.validation.decision, "pass");
    assert.ok(tone.validation.warnings.some((w) => w.includes("editorial_tone")));
  });

  test("6 defines/enforces quality standards", async () => {
    const engine = await build();
    engine.manageEditorialDirection(sampleInput);
    const standards = engine.defineContentStandards(sampleInput);
    assert.equal(standards.action, "define_content_standards");
    assert.equal(standards.validation.decision, "pass");
    const report = engine.produceEditorialReport(sampleInput);
    assert.ok(report.latestEditorialReport!.qualityStandards.length >= 2);
    assert.ok(
      report.latestEditorialReport!.qualityStandards.every((s) => s.enforced === true),
    );
  });

  test("7 completes editorial review", async () => {
    const engine = await build();
    engine.manageEditorialDirection(sampleInput);
    engine.defineChannelIdentity(sampleInput);
    engine.defineTargetAudience(sampleInput);
    engine.defineEditorialTone(sampleInput);
    engine.defineContentStandards(sampleInput);
    engine.definePublishingPriorities(sampleInput);
    engine.ensureBrandConsistency(sampleInput);
    const review = engine.reviewContentQuality(sampleInput);
    assert.equal(review.action, "review_content_quality");
    assert.equal(review.validation.decision, "pass");
    const approval = engine.approveEditorialDecisions({
      ...sampleInput,
      pillowGovernanceConfirmed: true,
    });
    assert.equal(approval.action, "approve_editorial_decisions");
    assert.equal(approval.validation.decision, "pass");
  });

  test("8 produces Editorial Report with all required fields", async () => {
    const engine = await build();
    engine.manageEditorialDirection(sampleInput);
    engine.defineChannelIdentity(sampleInput);
    engine.defineTargetAudience(sampleInput);
    engine.defineEditorialTone(sampleInput);
    engine.defineContentStandards(sampleInput);
    engine.definePublishingPriorities(sampleInput);
    engine.reviewContentQuality(sampleInput);
    engine.ensureBrandConsistency(sampleInput);
    engine.maintainLongTermStrategy(sampleInput);
    engine.approveEditorialDecisions({
      ...sampleInput,
      pillowGovernanceConfirmed: true,
    });
    const report = engine.produceEditorialReport(sampleInput);
    const latest = report.latestEditorialReport!;
    assert.ok(latest.editorialReportId.startsWith("ecw-edr-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.mediaBusinessId, "mbiz-media-insights-01");
    assert.equal(latest.channelId, "chn-youtube-insights-01");
    assert.ok(latest.editorialStrategy.length > 10);
    assert.ok(latest.targetAudience.length > 10);
    assert.equal(latest.editorialTone, "authoritative");
    assert.ok(Array.isArray(latest.qualityStandards) && latest.qualityStandards.length >= 1);
    assert.ok(Array.isArray(latest.contentPriorities) && latest.contentPriorities.length >= 1);
    assert.equal(latest.reviewOutcome, "approved");
    assert.ok(Array.isArray(latest.executiveRecommendations) && latest.executiveRecommendations.length >= 1);
    assert.equal(latest.metadataVersion, ECW_METADATA_VERSION);
    assert.equal(latest.reportVersion, EDITORIAL_REPORT_VERSION);
    assert.equal(latest.neverWriteScripts, true);
    assert.equal(latest.neverPublishContent, true);
    assert.equal(latest.neverBypassPillowGovernance, true);
    assert.ok(latest.preservedDecisions.length >= 1);
  });

  test("9 rejects script/thumbnail/video/publish/override/Q4-03 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { writeScripts: true },
      { createThumbnails: true },
      { assembleVideos: true },
      { publishContent: true },
      { bypassPillowGovernance: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ403OrLater: true },
    ] as const) {
      const report = engine.produceEditorialReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestEditorialReport, null);
    }
  });

  test("10 lists and submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createEditorInChiefWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-ecw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.manageEditorialDirection(sampleInput);
    engine.defineChannelIdentity(sampleInput);
    engine.defineTargetAudience(sampleInput);
    engine.defineEditorialTone(sampleInput);
    engine.defineContentStandards(sampleInput);
    engine.definePublishingPriorities(sampleInput);
    engine.reviewContentQuality(sampleInput);
    engine.approveEditorialDecisions({
      ...sampleInput,
      pillowGovernanceConfirmed: true,
    });
    const produced = engine.produceEditorialReport(sampleInput);
    const listed = engine.listEditorialReports();
    assert.equal(listed.action, "list");
    assert.ok(listed.editorialReports.length >= 1);
    const submitted = engine.submitReport({
      editorialReportId: produced.latestEditorialReport!.editorialReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-02"]);
    assert.equal(submitted.latestEditorialReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestEditorialReport!.executiveReportId, "ert-worker-ecw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-02");
    assert.equal(cockpit.neverWriteScripts, true);
    assert.equal(cockpit.neverPublishContent, true);
    assert.equal(cockpit.neverBypassPillowGovernance, true);
  });
});
