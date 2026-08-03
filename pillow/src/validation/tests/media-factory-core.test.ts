import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  MFC_APPROVAL_STATUSES,
  MFC_CHANNEL_TYPES,
  MFC_PIPELINE_TYPES,
  MEDIA_BUSINESS_MISSION_VERSION,
  MEDIA_FACTORY_REPORT_VERSION,
  buildMediaFactoryCoreConfiguration,
  createMediaFactoryCore,
  resetMediaFactoryCoreForTesting,
  type MediaFactoryCoreInput,
} from "../../media-factory-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleMissionInput(
  overrides: Partial<MediaFactoryCoreInput> = {},
): MediaFactoryCoreInput {
  return {
    mediaBusinessId: "mbiz-youtube-01",
    mediaBusinessName: "EmpireAI YouTube Channel",
    missionObjective: "Coordinate short-form video production and publishing.",
    channelType: "youtube",
    pipelineType: "short_form_video",
    executiveSummary: "YouTube short-form orchestration mission.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createMediaFactoryCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMediaFactoryCore(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q4-01 Media Factory Core", () => {
  beforeEach(resetMediaFactoryCoreForTesting);

  test("1 locks mandatory media-factory-core boundaries", () => {
    const c = buildMediaFactoryCoreConfiguration(REPO_ROOT, {
      neverWriteScripts: false as never,
      neverGenerateImages: false as never,
      neverGenerateVideos: false as never,
      neverPublishDirectly: false as never,
      neverBypassApproval: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ402OrLater: false as never,
    });
    assert.equal(c.neverWriteScripts, true);
    assert.equal(c.neverGenerateImages, true);
    assert.equal(c.neverGenerateVideos, true);
    assert.equal(c.neverPublishDirectly, true);
    assert.equal(c.neverBypassApproval, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ402OrLater, true);
  });

  test("2 initializes PILLOW-MFC-001 for Q4-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-01");
    assert.equal(state.engineVersion, "PILLOW-MFC-001");
    for (const type of MFC_CHANNEL_TYPES) {
      assert.ok(state.configuration.channelTypes.includes(type));
    }
    for (const type of MFC_PIPELINE_TYPES) {
      assert.ok(state.configuration.pipelineTypes.includes(type));
    }
    for (const status of MFC_APPROVAL_STATUSES) {
      assert.ok(state.configuration.approvalStatuses.includes(status));
    }
  });

  test("3 creates a media business mission", async () => {
    const report = (await build()).createMediaBusinessMission(sampleMissionInput());
    assert.equal(report.action, "create_media_business_mission");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestMission!.mediaMissionId.startsWith("mfc-mbm-"));
    assert.equal(report.latestMission!.mediaBusinessId, "mbiz-youtube-01");
    assert.equal(report.latestMission!.currentStatus, "active");
    assert.equal(report.latestMission!.metadataVersion, "MFC-001-v1");
    assert.equal(report.latestMission!.missionVersion, MEDIA_BUSINESS_MISSION_VERSION);
  });

  test("4 registers a media channel", async () => {
    const engine = await build();
    engine.createMediaBusinessMission(sampleMissionInput());
    const report = engine.registerChannel({
      channelId: "ch-youtube-main",
      channelType: "youtube",
      channelName: "EmpireAI Main",
      validated: true,
    });
    assert.equal(report.action, "register_channel");
    assert.equal(report.validation.decision, "pass");
    assert.equal(report.latestMission!.channelId, "ch-youtube-main");
    assert.equal(report.latestMission!.channelType, "youtube");
    assert.equal(report.latestMission!.currentStage, "channel_registered");
  });

  test("5 registers a content pipeline", async () => {
    const engine = await build();
    engine.createMediaBusinessMission(sampleMissionInput());
    const report = engine.registerPipeline({
      pipelineId: "pl-short-form",
      pipelineType: "short_form_video",
      pipelineName: "Short Form Video Pipeline",
      validated: true,
    });
    assert.equal(report.action, "register_pipeline");
    assert.equal(report.validation.decision, "pass");
    assert.equal(report.latestMission!.pipelineId, "pl-short-form");
    assert.equal(report.latestMission!.pipelineType, "short_form_video");
    assert.equal(report.latestMission!.currentStage, "pipeline_registered");
  });

  test("6 coordinates downstream media workers", async () => {
    const engine = await build();
    engine.createMediaBusinessMission(sampleMissionInput());
    const report = engine.coordinateWorkers({
      assignedWorkers: ["wkr-script-writer-01", "wkr-video-editor-01"],
      assignedWorkerRoles: ["script_writer", "video_editor"],
      validated: true,
    });
    assert.equal(report.action, "coordinate_workers");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestMission!.assignedWorkers.includes("wkr-script-writer-01"));
    assert.ok(report.latestMission!.assignedWorkerRoles.includes("video_editor"));
    assert.equal(report.latestMission!.productionStatus, "coordinating");
  });

  test("7 rejects approval bypass and requires Grand King approval", async () => {
    const engine = await build();
    engine.createMediaBusinessMission(sampleMissionInput());
    const bypass = engine.coordinateApproval({ bypassApproval: true, validated: true });
    assert.equal(bypass.validation.decision, "fail");
    assert.equal(bypass.latestMission!.approvalStatus, "blocked_bypass_attempt");

    const noGk = engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: false,
      validated: true,
    });
    assert.equal(noGk.validation.decision, "fail");

    const approved = engine.coordinateApproval({
      approvalStatus: "in_review",
      grandKingApproved: true,
      validated: true,
    });
    assert.equal(approved.validation.decision, "pass");
    assert.equal(approved.latestMission!.approvalStatus, "in_review");

    const finalApproval = engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    assert.equal(finalApproval.validation.decision, "pass");
    assert.equal(finalApproval.latestMission!.approvalStatus, "approved");
  });

  test("8 produces Media Factory Report with all required fields", async () => {
    const engine = await build();
    engine.createMediaBusinessMission(sampleMissionInput());
    engine.registerChannel({
      channelId: "ch-yt-01",
      channelType: "youtube",
      channelName: "Main Channel",
      validated: true,
    });
    engine.registerPipeline({
      pipelineId: "pl-sfv-01",
      pipelineType: "short_form_video",
      pipelineName: "Short Form",
      validated: true,
    });
    engine.coordinateWorkers({
      assignedWorkers: ["wkr-editor-01"],
      assignedWorkerRoles: ["editor"],
      validated: true,
    });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });

    const report = engine.produceReport({ validated: true });
    assert.equal(report.action, "produce_report");
    assert.equal(report.validation.decision, "pass");
    const mfr = report.latestReport!;
    assert.ok(mfr.mediaMissionId);
    assert.ok(mfr.timestamp);
    assert.equal(mfr.mediaBusinessId, "mbiz-youtube-01");
    assert.equal(mfr.channelId, "ch-yt-01");
    assert.equal(mfr.channelType, "youtube");
    assert.equal(mfr.contentPipeline, "short_form_video");
    assert.ok(mfr.currentStage);
    assert.ok(Array.isArray(mfr.assignedWorkers));
    assert.equal(mfr.approvalStatus, "approved");
    assert.ok(mfr.publishingStatus);
    assert.ok(mfr.learningStatus);
    assert.ok(mfr.executiveSummary);
    assert.equal(mfr.metadataVersion, "MFC-001-v1");
    assert.equal(mfr.reportVersion, MEDIA_FACTORY_REPORT_VERSION);
    assert.ok(mfr.productionStatus);
    assert.ok(Array.isArray(mfr.assignedWorkerRoles));
    assert.equal(mfr.pipelineId, "pl-sfv-01");
    assert.ok(Array.isArray(mfr.traceabilityRefs));
    assert.ok(Array.isArray(mfr.preservedDecisions));
    assert.ok(mfr.workerId);
    assert.equal(mfr.neverWriteScripts, true);
    assert.equal(mfr.neverPublishDirectly, true);
    assert.equal(mfr.neverBypassApproval, true);
  });

  test("9 rejects content-gen, publish-direct, and override boundaries", async () => {
    const engine = await build();
    engine.createMediaBusinessMission(sampleMissionInput());
    assert.equal(
      engine.createMediaBusinessMission(sampleMissionInput({ writeScripts: true })).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.registerChannel({ generateImages: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerPipeline({ generateVideos: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.coordinatePublishing({ publishDirectly: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ overridePillow: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ overrideGrandKing: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ implementQ402OrLater: true, validated: true }).validation.decision,
      "fail",
    );
  });

  test("10 lists missions and submits report via ERR", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({
            records: [{ reportId: `ert-mfc-test-${Date.now()}` }],
          }),
        },
      },
    });
    engine.createMediaBusinessMission(sampleMissionInput());
    engine.registerChannel({ channelId: "ch-01", channelType: "youtube", validated: true });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    engine.produceReport({ validated: true });

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.missions.length >= 1);

    const submit = engine.submitReport({ validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(
      submit.validation.decision === "pass" || submit.validation.decision === "partial",
    );
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);
  });
});
