import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  OUTPUT_ASPECTS,
  OUTPUT_RESOLUTIONS,
  VAW_CAPABILITIES,
  VAW_INTEGRATION_TARGETS,
  VAW_METADATA_VERSION,
  VAW_REPORT_VERSION,
  buildVideoAssemblyWorkerConfiguration,
  createVideoAssemblyWorker,
  resetVideoAssemblyWorkerForTesting,
} from "../../video-assembly-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createVideoAssemblyWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createVideoAssemblyWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  assemblyId: "vaw-asset-001",
  scriptId: "scw-scr-001",
  channelId: "chn-youtube-insights-01",
  topicId: "tpw-topic-001",
  voiceAssetId: "gen-vow-audio-1",
  voiceReportId: "vow-rpt-001",
  visualAssetIds: ["vis-hero-001", "vis-broll-001"],
  creativeAssetIds: ["cre-graphic-001", "cre-overlay-001"],
  musicAssetId: "mus-bed-001",
  narrationReadyText:
    "Welcome to today's insight. Artificial intelligence productivity is incomplete without orchestration.",
  scriptSections: [
    {
      sectionId: "sec-hook",
      heading: "Hook",
      body: "What if AI productivity is incomplete without orchestration?",
    },
    {
      sectionId: "sec-body",
      heading: "Body",
      body: "EmpireAI coordinates media workers so narration stays on brand and on pace.",
    },
    {
      sectionId: "sec-close",
      heading: "Close",
      body: "Subscribe for the next operational playbook.",
    },
  ],
  aspects: ["landscape", "vertical", "square"] as const,
  resolutions: ["hd", "full_hd"] as const,
  includeCaptions: true,
  validated: true,
};

function receiveAll(engine: Awaited<ReturnType<typeof build>>) {
  engine.receiveApprovedScripts(baseInput);
  engine.receiveApprovedVoiceAssets(baseInput);
  engine.receiveApprovedVisualAssets(baseInput);
  engine.receiveApprovedCreativeAssets(baseInput);
  engine.receiveApprovedMusicAssets(baseInput);
}

describe("Q4-11 Video Assembly Worker", () => {
  beforeEach(resetVideoAssemblyWorkerForTesting);

  test("1 locks mandatory video-assembly-worker boundaries", () => {
    const c = buildVideoAssemblyWorkerConfiguration(REPO_ROOT, {
      neverWriteScripts: false as never,
      neverGenerateVoiceovers: false as never,
      neverGenerateThumbnails: false as never,
      neverPublishMedia: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ412OrLater: false as never,
      preserveCompleteAssetTraceability: false as never,
      preserveSynchronizationBetweenMediaAssets: false as never,
      validateRenderingQuality: false as never,
    });
    assert.equal(c.neverWriteScripts, true);
    assert.equal(c.neverGenerateVoiceovers, true);
    assert.equal(c.neverGenerateThumbnails, true);
    assert.equal(c.neverPublishMedia, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ412OrLater, true);
    assert.equal(c.preserveCompleteAssetTraceability, true);
    assert.equal(c.preserveSynchronizationBetweenMediaAssets, true);
    assert.equal(c.validateRenderingQuality, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-VAW-001 for Q4-11 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-11");
    assert.equal(state.engineVersion, "PILLOW-VAW-001");
    assert.equal(state.configuration.workerId, "wkr-video-assembly-01");
    assert.equal(state.configuration.role, "role-creator-video-assembly");
    for (const target of VAW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const aspect of OUTPUT_ASPECTS) {
      assert.ok(typeof aspect === "string");
    }
    for (const resolution of OUTPUT_RESOLUTIONS) {
      assert.ok(typeof resolution === "string");
    }
    assert.ok(VAW_CAPABILITIES.includes("receive_approved_scripts"));
    assert.ok(VAW_CAPABILITIES.includes("produce_machine_readable_video_assembly_reports"));
    assert.ok(VAW_CAPABILITIES.includes("integrate_voice_worker"));
    assert.ok(VAW_CAPABILITIES.includes("integrate_image_creative_worker"));
  });

  test("3 receives media assets", async () => {
    const engine = await build();
    const script = engine.receiveApprovedScripts(baseInput);
    const voice = engine.receiveApprovedVoiceAssets(baseInput);
    const visuals = engine.receiveApprovedVisualAssets(baseInput);
    const creatives = engine.receiveApprovedCreativeAssets(baseInput);
    const music = engine.receiveApprovedMusicAssets(baseInput);
    assert.equal(script.action, "receive_approved_scripts");
    assert.equal(voice.action, "receive_approved_voice_assets");
    assert.equal(visuals.action, "receive_approved_visual_assets");
    assert.equal(creatives.action, "receive_approved_creative_assets");
    assert.equal(music.action, "receive_approved_music_assets");
    assert.notEqual(music.validation.decision, "fail");
    assert.ok(engine.getEngineRecord());
  });

  test("4 assembles timeline with synchronized voice and visuals", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.synchronizeNarrationAndVisuals(baseInput);
    assert.equal(report.action, "synchronize_narration_and_visuals");
    assert.notEqual(report.validation.decision, "fail");
    const assembly = report.latestAssemblyReport!;
    assert.ok(assembly.sceneTimeline.length >= 2);
    for (const scene of assembly.sceneTimeline) {
      assert.ok(scene.sceneId);
      assert.ok(scene.voiceAssetId);
      assert.ok(scene.visualAssetIds.length >= 1);
      assert.ok(scene.endSec > scene.startSec);
    }
  });

  test("5 applies transitions and motion effects", async () => {
    const engine = await build();
    receiveAll(engine);
    engine.synchronizeNarrationAndVisuals(baseInput);
    const transitions = engine.applySceneTransitions(baseInput);
    const motion = engine.applyMotionEffects(baseInput);
    assert.equal(transitions.action, "apply_scene_transitions");
    assert.equal(motion.action, "apply_motion_effects");
    assert.notEqual(motion.validation.decision, "fail");
    const assembly = motion.latestAssemblyReport!;
    assert.ok(assembly.sceneTimeline.every((s) => s.transition));
    assert.ok(assembly.sceneTimeline.every((s) => s.motionEffect && s.motionEffect !== "none"));
  });

  test("6 produces multiple output resolutions / final video rendered", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.produceMultipleOutputResolutions(baseInput);
    assert.equal(report.action, "produce_multiple_output_resolutions");
    assert.notEqual(report.validation.decision, "fail");
    const assembly = report.latestAssemblyReport!;
    assert.ok(assembly.outputFormats.length >= 2);
    assert.ok(assembly.finalVideoReference.videoId);
    assert.ok(assembly.finalVideoReference.primaryPath);
    const aspects = new Set(assembly.outputFormats.map((f) => f.aspect));
    assert.ok(aspects.has("landscape") || aspects.has("vertical") || aspects.has("square"));
  });

  test("7 validates rendering quality", async () => {
    const engine = await build();
    receiveAll(engine);
    engine.produceMultipleOutputResolutions(baseInput);
    const report = engine.validateRenderingQuality(baseInput);
    assert.equal(report.action, "validate_rendering_quality");
    assert.notEqual(report.validation.decision, "fail");
    const assembly = report.latestAssemblyReport!;
    assert.notEqual(assembly.qualityValidation.status, "fail");
    assert.equal(assembly.qualityValidation.syncValidated, true);
    assert.equal(assembly.qualityValidation.timelineValidated, true);
    assert.ok(assembly.qualityValidation.score >= 60);
  });

  test("8 produces Video Assembly Report with all required fields", async () => {
    const engine = await build();
    receiveAll(engine);
    const { assemblyId: _omit, ...reportInput } = baseInput;
    const report = engine.produceVideoAssemblyReport(reportInput);
    const assembly = report.latestAssemblyReport!;
    assert.ok(assembly.assemblyId.startsWith("vaw-rpt-"));
    assert.ok(assembly.timestamp);
    assert.equal(assembly.scriptId, "scw-scr-001");
    assert.equal(assembly.voiceAssetId, "gen-vow-audio-1");
    assert.ok(assembly.visualAssetIds.length >= 1);
    assert.ok(assembly.creativeAssetIds.length >= 1);
    assert.equal(assembly.musicAssetId, "mus-bed-001");
    assert.ok(assembly.sceneTimeline.length >= 1);
    assert.ok(assembly.renderSettings.settingsId);
    assert.ok(assembly.outputFormats.length >= 2);
    assert.ok(assembly.qualityValidation.status);
    assert.ok(assembly.finalVideoReference.videoId);
    assert.equal(assembly.metadataVersion, VAW_METADATA_VERSION);
    assert.equal(assembly.reportVersion, VAW_REPORT_VERSION);
    assert.equal(assembly.neverWriteScripts, true);
    assert.equal(assembly.neverGenerateVoiceovers, true);
    assert.equal(assembly.neverGenerateThumbnails, true);
    assert.equal(assembly.neverPublishMedia, true);
    assert.equal(assembly.neverOverridePillow, true);
    assert.equal(assembly.neverOverrideGrandKing, true);
    assert.equal(assembly.neverImplementQ412OrLater, true);
    assert.equal(assembly.preserveCompleteAssetTraceability, true);
    assert.equal(assembly.structuralSignalOnly, true);
    assert.ok(assembly.traceabilityRefs.length >= 1);
    assert.ok(assembly.preservedDecisions.length >= 1);
  });

  test("9 rejects write/voiceover/thumbnail/publish/override/Q4-12", async () => {
    const engine = await build();
    receiveAll(engine);
    for (const forbidden of [
      { writeScripts: true },
      { generateVoiceovers: true },
      { generateThumbnails: true },
      { publishMedia: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ412OrLater: true },
    ] as const) {
      const report = engine.produceVideoAssemblyReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestAssemblyReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createVideoAssemblyWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-vaw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    receiveAll(engine);
    const produced = engine.produceVideoAssemblyReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.assemblyReports.length >= 1);
    const submitted = engine.submitReport({
      assemblyId: produced.latestAssemblyReport!.assemblyId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-11"]);
    assert.equal(submitted.latestAssemblyReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestAssemblyReport!.executiveReportId, "ert-worker-vaw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-11");
    assert.equal(cockpit.neverPublishMedia, true);
    assert.equal(cockpit.neverWriteScripts, true);
  });
});
