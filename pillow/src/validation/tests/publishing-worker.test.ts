import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APPROVAL_STATUSES,
  PBW_CAPABILITIES,
  PBW_INTEGRATION_TARGETS,
  PBW_METADATA_VERSION,
  PBW_REPORT_VERSION,
  PUBLISHING_PLATFORMS,
  READINESS_STATUSES,
  buildPublishingWorkerConfiguration,
  createPublishingWorker,
  resetPublishingWorkerForTesting,
} from "../../publishing-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createPublishingWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createPublishingWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  publishingReportId: "pbw-asset-001",
  mediaId: "vid-vaw-001",
  channelId: "chn-youtube-insights-01",
  assemblyId: "vaw-rpt-001",
  scriptId: "scw-scr-001",
  targetPlatform: "youtube" as const,
  topicTitle: "AI Productivity Without Orchestration",
  hookText: "What if AI productivity is incomplete without orchestration?",
  narrationReadyText:
    "What if AI productivity is incomplete without orchestration? EmpireAI closes the gap with curious, cinematic storytelling.",
  thumbnailId: "thw-thumb-primary-01",
  thumbnailPath: "assets/thumbnails/thw-thumb-primary-01.descriptor.json",
  mediaAssetRefs: ["media:vid-vaw-001", "audio:msw-rpt-001", "subs:stw-rpt-001"],
  approvalStatus: "approved" as const,
  pillowAuthorized: true,
  validated: true,
};

function receiveMedia(engine: Awaited<ReturnType<typeof build>>) {
  engine.receiveCompletedMediaAssets(baseInput);
}

describe("Q4-14 Publishing Worker", () => {
  beforeEach(resetPublishingWorkerForTesting);

  test("1 locks mandatory publishing-worker boundaries", () => {
    const c = buildPublishingWorkerConfiguration(REPO_ROOT, {
      neverAutomaticallyPublishContent: false as never,
      neverModifyApprovedMediaAssets: false as never,
      neverOverrideApprovalWorkflows: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ415OrLater: false as never,
      preserveCompleteAssetTraceability: false as never,
      preservePublishingMetadataHistory: false as never,
      validatePlatformRequirements: false as never,
      validateApprovalStatusBeforePublication: false as never,
    });
    assert.equal(c.neverAutomaticallyPublishContent, true);
    assert.equal(c.neverModifyApprovedMediaAssets, true);
    assert.equal(c.neverOverrideApprovalWorkflows, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ415OrLater, true);
    assert.equal(c.preserveCompleteAssetTraceability, true);
    assert.equal(c.preservePublishingMetadataHistory, true);
    assert.equal(c.validatePlatformRequirements, true);
    assert.equal(c.validateApprovalStatusBeforePublication, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-PBW-001 for Q4-14 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-14");
    assert.equal(state.engineVersion, "PILLOW-PBW-001");
    assert.equal(state.configuration.workerId, "wkr-publishing-01");
    assert.equal(state.configuration.role, "role-creator-publishing");
    for (const target of PBW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const platform of PUBLISHING_PLATFORMS) {
      assert.ok(typeof platform === "string");
    }
    for (const status of READINESS_STATUSES) {
      assert.ok(typeof status === "string");
    }
    for (const status of APPROVAL_STATUSES) {
      assert.ok(typeof status === "string");
    }
    assert.ok(PBW_CAPABILITIES.includes("generate_optimized_video_titles"));
    assert.ok(PBW_CAPABILITIES.includes("prepare_platform_specific_upload_packages"));
    assert.ok(PBW_CAPABILITIES.includes("produce_machine_readable_publishing_reports"));
    assert.ok(PBW_CAPABILITIES.includes("integrate_thumbnail_worker"));
  });

  test("3 prepares publishing package with platform metadata", async () => {
    const engine = await build();
    receiveMedia(engine);
    const titles = engine.generateOptimizedVideoTitles(baseInput);
    const descriptions = engine.generatePlatformDescriptions(baseInput);
    const tags = engine.generateTagsAndKeywords(baseInput);
    assert.equal(titles.action, "generate_optimized_video_titles");
    assert.equal(descriptions.action, "generate_platform_descriptions");
    assert.equal(tags.action, "generate_tags_and_keywords");
    assert.notEqual(tags.validation.decision, "fail");
    const report = tags.latestPublishingReport!;
    assert.ok(report.videoTitle.length > 0);
    assert.ok(report.description.length > 0);
    assert.ok(report.tags.length >= 5);
    assert.equal(report.targetPlatform, "youtube");
  });

  test("4 links approved thumbnail", async () => {
    const engine = await build();
    receiveMedia(engine);
    const report = engine.selectApprovedThumbnails(baseInput);
    assert.equal(report.action, "select_approved_thumbnails");
    assert.notEqual(report.validation.decision, "fail");
    const pub = report.latestPublishingReport!;
    assert.equal(pub.thumbnailReference.thumbnailId, "thw-thumb-primary-01");
    assert.equal(pub.thumbnailReference.approved, true);
    assert.ok(pub.thumbnailReference.assetPath.includes("thw-thumb-primary-01"));
  });

  test("5 creates publishing schedule and playlist", async () => {
    const engine = await build();
    receiveMedia(engine);
    const playlist = engine.generatePlaylists(baseInput);
    const schedule = engine.generatePublishingSchedules(baseInput);
    assert.equal(playlist.action, "generate_playlists");
    assert.equal(schedule.action, "generate_publishing_schedules");
    assert.notEqual(schedule.validation.decision, "fail");
    const pub = schedule.latestPublishingReport!;
    assert.ok(pub.playlist.playlistId);
    assert.equal(pub.playlist.platform, "youtube");
    assert.ok(pub.scheduledPublishTime);
    assert.ok(Date.parse(pub.scheduledPublishTime) > Date.now());
  });

  test("6 validates platform publishing readiness", async () => {
    const engine = await build();
    receiveMedia(engine);
    engine.generateOptimizedVideoTitles(baseInput);
    engine.selectApprovedThumbnails(baseInput);
    const report = engine.validatePublishingReadiness(baseInput);
    assert.equal(report.action, "validate_publishing_readiness");
    assert.notEqual(report.validation.decision, "fail");
    const pub = report.latestPublishingReport!;
    assert.equal(pub.publishingReadiness.status, "ready");
    assert.equal(pub.publishingReadiness.platformValidated, true);
    assert.equal(pub.publishingReadiness.approvalValidated, true);
    assert.equal(pub.publishingReadiness.metadataComplete, true);
    assert.equal(pub.automaticallyPublishAuthorized, false);
  });

  test("7 prepares platform-specific upload package", async () => {
    const engine = await build();
    receiveMedia(engine);
    const report = engine.preparePlatformUploadPackages(baseInput);
    assert.equal(report.action, "prepare_platform_upload_packages");
    assert.notEqual(report.validation.decision, "fail");
    const pkg = report.latestPublishingReport!.uploadPackage;
    assert.ok(pkg.packageId);
    assert.equal(pkg.platform, "youtube");
    assert.equal(pkg.mediaId, "vid-vaw-001");
    assert.ok(pkg.title);
    assert.ok(pkg.tags.length >= 1);
    assert.ok(pkg.packagePath.includes("packages/publishing/"));
    assert.ok(pkg.assetRefs.length >= 1);
  });

  test("8 produces Publishing Report with all required fields", async () => {
    const engine = await build();
    receiveMedia(engine);
    const { publishingReportId: _omit, ...reportInput } = baseInput;
    const report = engine.producePublishingReport(reportInput);
    const pub = report.latestPublishingReport!;
    assert.ok(pub.publishingReportId.startsWith("pbw-rpt-"));
    assert.ok(pub.timestamp);
    assert.equal(pub.mediaId, "vid-vaw-001");
    assert.equal(pub.targetPlatform, "youtube");
    assert.ok(pub.videoTitle);
    assert.ok(pub.description);
    assert.ok(pub.tags.length >= 1);
    assert.ok(pub.thumbnailReference.thumbnailId);
    assert.ok(pub.playlist.playlistId);
    assert.ok(pub.scheduledPublishTime);
    assert.ok(pub.uploadPackage.packageId);
    assert.ok(pub.publishingReadiness.status);
    assert.equal(pub.metadataVersion, PBW_METADATA_VERSION);
    assert.equal(pub.reportVersion, PBW_REPORT_VERSION);
    assert.equal(pub.neverAutomaticallyPublishContent, true);
    assert.equal(pub.neverModifyApprovedMediaAssets, true);
    assert.equal(pub.neverOverrideApprovalWorkflows, true);
    assert.equal(pub.neverOverridePillow, true);
    assert.equal(pub.neverOverrideGrandKing, true);
    assert.equal(pub.neverImplementQ415OrLater, true);
    assert.equal(pub.automaticallyPublishAuthorized, false);
    assert.equal(pub.pillowAuthorizationRequired, true);
    assert.equal(pub.structuralSignalOnly, true);
    assert.ok(pub.traceabilityRefs.length >= 1);
  });

  test("9 rejects auto-publish/modify/override/Q4-15", async () => {
    const engine = await build();
    receiveMedia(engine);
    for (const forbidden of [
      { automaticallyPublishContent: true },
      { modifyApprovedMediaAssets: true },
      { overrideApprovalWorkflows: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ415OrLater: true },
    ] as const) {
      const report = engine.producePublishingReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestPublishingReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createPublishingWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-pbw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    receiveMedia(engine);
    const produced = engine.producePublishingReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.publishingReports.length >= 1);
    const submitted = engine.submitReport({
      publishingReportId: produced.latestPublishingReport!.publishingReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-14"]);
    assert.equal(submitted.latestPublishingReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestPublishingReport!.executiveReportId, "ert-worker-pbw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-14");
    assert.equal(cockpit.neverAutomaticallyPublishContent, true);
    assert.equal(cockpit.neverImplementQ415OrLater, true);
  });
});
