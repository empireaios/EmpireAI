import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUDIO_ASSET_TYPES,
  LICENSING_STATUSES,
  MSW_CAPABILITIES,
  MSW_INTEGRATION_TARGETS,
  MSW_METADATA_VERSION,
  MSW_REPORT_VERSION,
  MUSIC_MOODS,
  buildMusicSoundWorkerConfiguration,
  createMusicSoundWorker,
  resetMusicSoundWorkerForTesting,
} from "../../music-sound-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createMusicSoundWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMusicSoundWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  audioReportId: "msw-asset-001",
  scriptId: "scw-scr-001",
  videoId: "vid-vaw-001",
  channelId: "chn-youtube-insights-01",
  assemblyId: "vaw-rpt-001",
  requiredMood: "curious" as const,
  allowGeneratedMusic: true,
  narrationReadyText:
    "What if AI productivity is incomplete without orchestration? EmpireAI closes the gap with curious, cinematic storytelling.",
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
  sceneTimeline: [
    { sceneId: "scene-1", order: 1, startSec: 0, endSec: 8, scriptSectionId: "sec-hook" },
    { sceneId: "scene-2", order: 2, startSec: 8, endSec: 20, scriptSectionId: "sec-body" },
    { sceneId: "scene-3", order: 3, startSec: 20, endSec: 28, scriptSectionId: "sec-close" },
  ],
  validated: true,
};

function receiveAll(engine: Awaited<ReturnType<typeof build>>) {
  engine.receiveApprovedScripts(baseInput);
  engine.receiveApprovedVideoTimeline(baseInput);
}

describe("Q4-13 Music & Sound Worker", () => {
  beforeEach(resetMusicSoundWorkerForTesting);

  test("1 locks mandatory music-sound-worker boundaries", () => {
    const c = buildMusicSoundWorkerConfiguration(REPO_ROOT, {
      neverAssembleVideos: false as never,
      neverPublishMedia: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ414OrLater: false as never,
      neverUseUnapprovedCopyrightedAssets: false as never,
      preserveCompleteAssetTraceability: false as never,
      preserveLicensingInformation: false as never,
      preserveTimelineSynchronization: false as never,
      validateCopyrightCompliance: false as never,
    });
    assert.equal(c.neverAssembleVideos, true);
    assert.equal(c.neverPublishMedia, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ414OrLater, true);
    assert.equal(c.neverUseUnapprovedCopyrightedAssets, true);
    assert.equal(c.preserveCompleteAssetTraceability, true);
    assert.equal(c.preserveLicensingInformation, true);
    assert.equal(c.preserveTimelineSynchronization, true);
    assert.equal(c.validateCopyrightCompliance, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-MSW-001 for Q4-13 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-13");
    assert.equal(state.engineVersion, "PILLOW-MSW-001");
    assert.equal(state.configuration.workerId, "wkr-music-sound-01");
    assert.equal(state.configuration.role, "role-creator-music-sound");
    for (const target of MSW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const type of AUDIO_ASSET_TYPES) {
      assert.ok(typeof type === "string");
    }
    for (const mood of MUSIC_MOODS) {
      assert.ok(typeof mood === "string");
    }
    for (const status of LICENSING_STATUSES) {
      assert.ok(typeof status === "string");
    }
    assert.ok(MSW_CAPABILITIES.includes("select_licensed_music"));
    assert.ok(MSW_CAPABILITIES.includes("produce_machine_readable_music_sound_reports"));
    assert.ok(MSW_CAPABILITIES.includes("integrate_video_assembly_worker"));
  });

  test("3 selects music", async () => {
    const engine = await build();
    receiveAll(engine);
    const licensed = engine.selectLicensedMusic(baseInput);
    const generated = engine.selectGeneratedMusicWhereApproved(baseInput);
    assert.equal(licensed.action, "select_licensed_music");
    assert.equal(generated.action, "select_generated_music_where_approved");
    assert.notEqual(generated.validation.decision, "fail");
    const report = generated.latestAudioReport!;
    assert.ok(report.backgroundMusicAssets.length >= 2);
    assert.ok(report.backgroundMusicAssets.some((a) => a.source === "licensed_library"));
    assert.ok(report.backgroundMusicAssets.some((a) => a.source === "generated"));
  });

  test("4 selects sound effects", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.determineRequiredSoundEffects(baseInput);
    assert.equal(report.action, "determine_required_sound_effects");
    assert.notEqual(report.validation.decision, "fail");
    const audio = report.latestAudioReport!;
    assert.ok(audio.requiredSoundEffects.length >= 1);
    assert.ok(audio.soundEffectAssets.length >= 1);
  });

  test("5 generates audio timeline with scene synchronization", async () => {
    const engine = await build();
    receiveAll(engine);
    engine.selectLicensedMusic(baseInput);
    const musicMatch = engine.matchMusicToScenes(baseInput);
    const sfxMatch = engine.matchSoundEffectsToEvents(baseInput);
    assert.equal(musicMatch.action, "match_music_to_scenes");
    assert.equal(sfxMatch.action, "match_sound_effects_to_events");
    assert.notEqual(sfxMatch.validation.decision, "fail");
    const audio = sfxMatch.latestAudioReport!;
    assert.ok(audio.sceneTimeline.length >= 2);
    assert.ok(audio.audioPlacement.length >= 2);
    for (const scene of audio.sceneTimeline) {
      assert.ok(scene.sceneId);
      assert.ok(scene.endSec > scene.startSec);
      assert.ok(scene.musicAssetId);
    }
  });

  test("6 validates licensing", async () => {
    const engine = await build();
    receiveAll(engine);
    engine.selectLicensedMusic(baseInput);
    engine.selectGeneratedMusicWhereApproved(baseInput);
    const report = engine.validateLicensingCompliance(baseInput);
    assert.equal(report.action, "validate_licensing_compliance");
    assert.notEqual(report.validation.decision, "fail");
    const audio = report.latestAudioReport!;
    assert.notEqual(audio.licensingStatus, "unapproved");
    assert.notEqual(audio.licensingStatus, "restricted");
    assert.equal(audio.qualityValidation.licensingValidated, true);
    assert.equal(audio.qualityValidation.copyrightValidated, true);
    assert.ok(audio.backgroundMusicAssets.every((a) => a.licenseId));
  });

  test("7 determines music mood from content", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.determineRequiredMusicMood(baseInput);
    assert.equal(report.action, "determine_required_music_mood");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestAudioReport!.requiredMood, "curious");
  });

  test("8 produces Music & Sound Report with all required fields", async () => {
    const engine = await build();
    receiveAll(engine);
    const { audioReportId: _omit, ...reportInput } = baseInput;
    const report = engine.produceMusicSoundReport(reportInput);
    const audio = report.latestAudioReport!;
    assert.ok(audio.audioReportId.startsWith("msw-rpt-"));
    assert.ok(audio.timestamp);
    assert.equal(audio.videoId, "vid-vaw-001");
    assert.equal(audio.scriptId, "scw-scr-001");
    assert.ok(audio.backgroundMusicAssets.length >= 1);
    assert.ok(audio.soundEffectAssets.length >= 1);
    assert.ok(audio.sceneTimeline.length >= 1);
    assert.ok(audio.audioPlacement.length >= 1);
    assert.ok(audio.licensingStatus);
    assert.ok(audio.qualityValidation.status);
    assert.equal(audio.metadataVersion, MSW_METADATA_VERSION);
    assert.equal(audio.reportVersion, MSW_REPORT_VERSION);
    assert.equal(audio.neverAssembleVideos, true);
    assert.equal(audio.neverPublishMedia, true);
    assert.equal(audio.neverOverridePillow, true);
    assert.equal(audio.neverOverrideGrandKing, true);
    assert.equal(audio.neverImplementQ414OrLater, true);
    assert.equal(audio.neverUseUnapprovedCopyrightedAssets, true);
    assert.equal(audio.preserveLicensingInformation, true);
    assert.equal(audio.structuralSignalOnly, true);
    assert.ok(audio.traceabilityRefs.length >= 1);
  });

  test("9 rejects assemble/publish/override/unapproved/Q4-14", async () => {
    const engine = await build();
    receiveAll(engine);
    for (const forbidden of [
      { assembleVideos: true },
      { publishMedia: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ414OrLater: true },
      { useUnapprovedCopyrightedAssets: true },
    ] as const) {
      const report = engine.produceMusicSoundReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestAudioReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createMusicSoundWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-msw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    receiveAll(engine);
    const produced = engine.produceMusicSoundReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.audioReports.length >= 1);
    const submitted = engine.submitReport({
      audioReportId: produced.latestAudioReport!.audioReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-13"]);
    assert.equal(submitted.latestAudioReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestAudioReport!.executiveReportId, "ert-worker-msw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-13");
    assert.equal(cockpit.neverPublishMedia, true);
    assert.equal(cockpit.neverUseUnapprovedCopyrightedAssets, true);
  });
});
