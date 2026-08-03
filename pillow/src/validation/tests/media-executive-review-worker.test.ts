import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EDITORIAL_STATUSES,
  EXECUTIVE_RECOMMENDATIONS,
  MER_CAPABILITIES,
  MER_INTEGRATION_TARGETS,
  MER_METADATA_VERSION,
  MER_REPORT_VERSION,
  buildMediaExecutiveReviewWorkerConfiguration,
  createMediaExecutiveReviewWorker,
  resetMediaExecutiveReviewWorkerForTesting,
} from "../../media-executive-review-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createMediaExecutiveReviewWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMediaExecutiveReviewWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  reviewId: "mer-asset-001",
  mediaId: "vid-vaw-001",
  channelId: "chn-youtube-insights-01",
  mediaBusinessId: "mbiz-youtube-insights-01",
  scriptId: "scw-scr-001",
  thumbnailReportId: "thw-rpt-001",
  assemblyId: "vaw-rpt-001",
  publishingReportId: "pbw-rpt-001",
  analyticsReportId: "maw-rpt-001",
  learningReportId: "mlw-rpt-001",
  editorialApproved: true,
  scriptQualityScore: 88,
  thumbnailQualityScore: 86,
  visualAssetReady: true,
  voiceReady: true,
  subtitleReady: true,
  publishingPackageComplete: true,
  analyticsTraceable: true,
  learningTraceable: true,
  prerequisiteStatuses: [
    { workerKey: "publishing_worker", completed: true, reportId: "pbw-rpt-001" },
    { workerKey: "media_analytics_worker", completed: true, reportId: "maw-rpt-001" },
    { workerKey: "media_learning_worker", completed: true, reportId: "mlw-rpt-001" },
  ],
  publishingSignals: [
    {
      publishingReportId: "pbw-rpt-001",
      mediaId: "vid-vaw-001",
      channelId: "chn-youtube-insights-01",
      publishingReadinessStatus: "ready",
      title: "AI Productivity Without Orchestration",
      tagsCount: 8,
    },
  ],
  analyticsSignals: [
    {
      analyticsReportId: "maw-rpt-001",
      mediaId: "vid-vaw-001",
      channelId: "chn-youtube-insights-01",
      confidenceScore: 90,
    },
  ],
  learningSignals: [
    {
      learningReportId: "mlw-rpt-001",
      channelId: "chn-youtube-insights-01",
      confidenceScore: 85,
    },
  ],
  validated: true,
};

function receiveOutputs(engine: Awaited<ReturnType<typeof build>>) {
  engine.receiveAllCompletedMediaFactoryOutputs(baseInput);
}

describe("Q4-18 Media Executive Review Worker", () => {
  beforeEach(resetMediaExecutiveReviewWorkerForTesting);

  test("1 locks mandatory media-executive-review-worker boundaries", () => {
    const c = buildMediaExecutiveReviewWorkerConfiguration(REPO_ROOT, {
      neverPublishMedia: false as never,
      neverRewriteScripts: false as never,
      neverEditMediaAssets: false as never,
      neverModifyApprovedAssets: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ419OrLater: false as never,
      neverBypassPillowGovernance: false as never,
      verifyAllPrerequisiteWorkersCompletedSuccessfully: false as never,
      preserveCompleteTraceability: false as never,
      distinguishVerifiedFindingsFromRecommendations: false as never,
    });
    assert.equal(c.neverPublishMedia, true);
    assert.equal(c.neverRewriteScripts, true);
    assert.equal(c.neverEditMediaAssets, true);
    assert.equal(c.neverModifyApprovedAssets, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ419OrLater, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.verifyAllPrerequisiteWorkersCompletedSuccessfully, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.distinguishVerifiedFindingsFromRecommendations, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-MER-001 for Q4-18 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-18");
    assert.equal(state.engineVersion, "PILLOW-MER-001");
    assert.equal(state.configuration.workerId, "wkr-media-executive-review-01");
    assert.equal(state.configuration.role, "role-analyst-media-executive-review");
    for (const target of MER_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const decision of EXECUTIVE_RECOMMENDATIONS) {
      assert.ok(typeof decision === "string");
    }
    for (const status of EDITORIAL_STATUSES) {
      assert.ok(typeof status === "string");
    }
    assert.ok(MER_CAPABILITIES.includes("receive_all_completed_media_factory_outputs"));
    assert.ok(MER_CAPABILITIES.includes("recommend_approve_revise_or_reject"));
    assert.ok(MER_CAPABILITIES.includes("produce_machine_readable_media_executive_review_reports"));
    assert.ok(MER_CAPABILITIES.includes("integrate_publishing_worker"));
    assert.ok(MER_CAPABILITIES.includes("integrate_media_analytics_worker"));
    assert.ok(MER_CAPABILITIES.includes("integrate_media_learning_worker"));
  });

  test("3 reviews complete media package and verifies editorial compliance", async () => {
    const engine = await build();
    receiveOutputs(engine);
    const report = engine.verifyEditorialCompliance(baseInput);
    assert.equal(report.action, "verify_editorial_compliance");
    assert.notEqual(report.validation.decision, "fail");
    const review = report.latestReviewReport!;
    assert.ok(EDITORIAL_STATUSES.includes(review.editorialStatus));
    assert.equal(review.editorialStatus, "compliant");
  });

  test("4 verifies asset readiness across script/thumbnail/visual/voice/subtitle", async () => {
    const engine = await build();
    receiveOutputs(engine);
    const script = engine.verifyScriptQuality(baseInput);
    const thumb = engine.verifyThumbnailQuality(baseInput);
    const visual = engine.verifyVisualAssetReadiness(baseInput);
    const voice = engine.verifyVoiceAndSubtitleReadiness(baseInput);
    assert.equal(script.action, "verify_script_quality");
    assert.equal(thumb.action, "verify_thumbnail_quality");
    assert.equal(visual.action, "verify_visual_asset_readiness");
    assert.equal(voice.action, "verify_voice_and_subtitle_readiness");
    assert.notEqual(voice.validation.decision, "fail");
    const review = voice.latestReviewReport!;
    assert.equal(review.assetCompleteness.scriptReady, true);
    assert.equal(review.assetCompleteness.thumbnailReady, true);
    assert.equal(review.assetCompleteness.visualAssetsReady, true);
    assert.equal(review.assetCompleteness.voiceReady, true);
    assert.equal(review.assetCompleteness.subtitleReady, true);
  });

  test("5 verifies publishing readiness and analytics/learning traceability", async () => {
    const engine = await build();
    receiveOutputs(engine);
    const publishing = engine.verifyPublishingPackageCompleteness(baseInput);
    const trace = engine.verifyAnalyticsAndLearningTraceability(baseInput);
    assert.equal(publishing.action, "verify_publishing_package_completeness");
    assert.equal(trace.action, "verify_analytics_and_learning_traceability");
    assert.notEqual(trace.validation.decision, "fail");
    const review = trace.latestReviewReport!;
    assert.equal(review.assetCompleteness.publishingPackageReady, true);
    assert.equal(review.assetCompleteness.analyticsTraceable, true);
    assert.equal(review.assetCompleteness.learningTraceable, true);
  });

  test("6 identifies outstanding issues and generates executive recommendation", async () => {
    const engine = await build();
    receiveOutputs(engine);
    const issues = engine.identifyOutstandingIssues(baseInput);
    const recommend = engine.recommendApproveReviseOrReject(baseInput);
    assert.equal(issues.action, "identify_outstanding_issues");
    assert.equal(recommend.action, "recommend_approve_revise_or_reject");
    assert.notEqual(recommend.validation.decision, "fail");
    const review = recommend.latestReviewReport!;
    assert.ok(Array.isArray(review.outstandingIssues));
    assert.ok(EXECUTIVE_RECOMMENDATIONS.includes(review.executiveRecommendation));
    assert.ok(review.recommendationRationale.length > 0);
    assert.equal(review.executiveRecommendation, "Approve");
  });

  test("7 distinguishes verified findings from recommendations", async () => {
    const engine = await build();
    receiveOutputs(engine);
    const report = engine.produceMediaExecutiveReviewReport(baseInput);
    assert.notEqual(report.validation.decision, "fail");
    const review = report.latestReviewReport!;
    assert.ok(Array.isArray(review.verifiedFindings));
    assert.ok(Array.isArray(review.recommendationFindings));
    assert.ok(
      review.supportingEvidence.every(
        (e) => e.kind === "verified" || e.kind === "recommendation",
      ),
    );
  });

  test("8 produces Media Executive Review Report with all required fields", async () => {
    const engine = await build();
    receiveOutputs(engine);
    const { reviewId: _omit, ...reportInput } = baseInput;
    const report = engine.produceMediaExecutiveReviewReport(reportInput);
    const review = report.latestReviewReport!;
    assert.ok(review.reviewId.startsWith("mer-rpt-"));
    assert.ok(review.timestamp);
    assert.equal(review.mediaId, "vid-vaw-001");
    assert.equal(review.channelId, "chn-youtube-insights-01");
    assert.ok(review.editorialStatus);
    assert.ok(review.assetCompleteness);
    assert.ok(review.qualityAssessment);
    assert.ok(review.complianceAssessment);
    assert.ok(Array.isArray(review.outstandingIssues));
    assert.ok(EXECUTIVE_RECOMMENDATIONS.includes(review.executiveRecommendation));
    assert.ok(review.supportingEvidence.length >= 1);
    assert.ok(review.confidenceScore >= 40);
    assert.equal(review.metadataVersion, MER_METADATA_VERSION);
    assert.equal(review.reportVersion, MER_REPORT_VERSION);
    assert.equal(review.neverPublishMedia, true);
    assert.equal(review.neverRewriteScripts, true);
    assert.equal(review.neverEditMediaAssets, true);
    assert.equal(review.neverModifyApprovedAssets, true);
    assert.equal(review.neverOverridePillow, true);
    assert.equal(review.neverOverrideGrandKing, true);
    assert.equal(review.neverImplementQ419OrLater, true);
    assert.equal(review.neverBypassPillowGovernance, true);
    assert.equal(review.distinguishVerifiedFindingsFromRecommendations, true);
    assert.equal(review.structuralSignalOnly, true);
    assert.ok(review.sourceTraceabilityRefs.length >= 1);
    assert.ok(review.complianceAssessment.prerequisiteWorkersComplete);
  });

  test("9 rejects publish/rewrite/edit/modify/override/bypass/Q4-19", async () => {
    const engine = await build();
    receiveOutputs(engine);
    for (const forbidden of [
      { publishMedia: true },
      { rewriteScripts: true },
      { editMediaAssets: true },
      { modifyApprovedAssets: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ419OrLater: true },
      { bypassPillowGovernance: true },
    ] as const) {
      const report = engine.produceMediaExecutiveReviewReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReviewReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createMediaExecutiveReviewWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-mer-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    receiveOutputs(engine);
    const produced = engine.produceMediaExecutiveReviewReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.reviewReports.length >= 1);
    const submitted = engine.submitReport({
      reviewId: produced.latestReviewReport!.reviewId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-18"]);
    assert.equal(submitted.latestReviewReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReviewReport!.executiveReportId, "ert-worker-mer-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-18");
    assert.equal(cockpit.neverPublishMedia, true);
    assert.equal(cockpit.neverImplementQ419OrLater, true);
  });
});
