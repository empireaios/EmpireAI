import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EXPORT_FORMATS,
  STW_CAPABILITIES,
  STW_INTEGRATION_TARGETS,
  STW_METADATA_VERSION,
  STW_REPORT_VERSION,
  SUBTITLE_LANGUAGES,
  buildSubtitleWorkerConfiguration,
  createSubtitleWorker,
  resetSubtitleWorkerForTesting,
} from "../../subtitle-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createSubtitleWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSubtitleWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  subtitleReportId: "stw-asset-001",
  scriptId: "scw-scr-001",
  videoId: "vid-vaw-001",
  channelId: "chn-youtube-insights-01",
  voiceAssetId: "gen-vow-audio-1",
  voiceReportId: "vow-rpt-001",
  assemblyId: "vaw-rpt-001",
  subtitleLanguage: "en-US" as const,
  languages: ["en-US", "es-ES", "fr-FR"] as const,
  voiceDurationSec: 42,
  narrationReadyText:
    "Welcome to today's insight. Artificial intelligence productivity is incomplete without orchestration. Here is how EmpireAI closes the gap.",
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
  validated: true,
};

function receiveAll(engine: Awaited<ReturnType<typeof build>>) {
  engine.receiveApprovedScripts(baseInput);
  engine.receiveApprovedVoiceAssets(baseInput);
}

describe("Q4-12 Subtitle Worker", () => {
  beforeEach(resetSubtitleWorkerForTesting);

  test("1 locks mandatory subtitle-worker boundaries", () => {
    const c = buildSubtitleWorkerConfiguration(REPO_ROOT, {
      neverRewriteScripts: false as never,
      neverAssembleVideos: false as never,
      neverPublishContent: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ413OrLater: false as never,
      neverModifyApprovedScripts: false as never,
      preserveScriptTraceability: false as never,
      preserveSubtitleSynchronization: false as never,
      preserveTranscriptHistory: false as never,
      validateSubtitleQuality: false as never,
    });
    assert.equal(c.neverRewriteScripts, true);
    assert.equal(c.neverAssembleVideos, true);
    assert.equal(c.neverPublishContent, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ413OrLater, true);
    assert.equal(c.neverModifyApprovedScripts, true);
    assert.equal(c.preserveScriptTraceability, true);
    assert.equal(c.preserveSubtitleSynchronization, true);
    assert.equal(c.preserveTranscriptHistory, true);
    assert.equal(c.validateSubtitleQuality, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-STW-001 for Q4-12 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-12");
    assert.equal(state.engineVersion, "PILLOW-STW-001");
    assert.equal(state.configuration.workerId, "wkr-subtitle-01");
    assert.equal(state.configuration.role, "role-creator-subtitle");
    for (const target of STW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const language of SUBTITLE_LANGUAGES) {
      assert.ok(typeof language === "string");
    }
    for (const format of EXPORT_FORMATS) {
      assert.ok(typeof format === "string");
    }
    assert.ok(STW_CAPABILITIES.includes("generate_complete_transcripts"));
    assert.ok(STW_CAPABILITIES.includes("produce_machine_readable_subtitle_reports"));
    assert.ok(STW_CAPABILITIES.includes("integrate_voice_worker"));
    assert.ok(STW_CAPABILITIES.includes("integrate_video_assembly_worker"));
  });

  test("3 generates transcript", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.generateCompleteTranscripts(baseInput);
    assert.equal(report.action, "generate_complete_transcripts");
    assert.notEqual(report.validation.decision, "fail");
    const subtitle = report.latestSubtitleReport!;
    assert.ok(subtitle.transcript.length > 20);
    assert.ok(subtitle.transcript.includes("EmpireAI") || subtitle.transcript.includes("AI"));
  });

  test("4 generates subtitle timing and synchronized captions", async () => {
    const engine = await build();
    receiveAll(engine);
    engine.generateCompleteTranscripts(baseInput);
    const captions = engine.generateSynchronizedCaptions(baseInput);
    const timing = engine.generateSubtitleTiming(baseInput);
    assert.equal(captions.action, "generate_synchronized_captions");
    assert.equal(timing.action, "generate_subtitle_timing");
    assert.notEqual(timing.validation.decision, "fail");
    const subtitle = timing.latestSubtitleReport!;
    assert.ok(subtitle.captionTimeline.length >= 2);
    for (const cue of subtitle.captionTimeline) {
      assert.ok(cue.cueId);
      assert.ok(cue.endMs > cue.startMs);
      assert.ok(cue.text.length > 0);
    }
    assert.ok(subtitle.timingAccuracy.accuracyScore >= 60);
  });

  test("5 produces multiple export formats", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.produceExportableSubtitleFiles(baseInput);
    assert.equal(report.action, "produce_exportable_subtitle_files");
    assert.notEqual(report.validation.decision, "fail");
    const subtitle = report.latestSubtitleReport!;
    assert.ok(subtitle.exportFormats.length >= 4);
    const formats = new Set(subtitle.exportFormats.map((f) => f.format));
    assert.ok(formats.has("srt"));
    assert.ok(formats.has("vtt"));
    assert.ok(formats.has("txt_transcript"));
    assert.ok(formats.has("caption_timeline"));
    assert.ok(subtitle.exportFormats.every((f) => f.exportable === true));
  });

  test("6 validates subtitle quality and sync detection", async () => {
    const engine = await build();
    receiveAll(engine);
    engine.generateSynchronizedCaptions(baseInput);
    const validated = engine.validateSubtitleTimingAccuracy(baseInput);
    const sync = engine.detectSynchronizationIssues(baseInput);
    assert.equal(validated.action, "validate_subtitle_timing_accuracy");
    assert.equal(sync.action, "detect_synchronization_issues");
    assert.notEqual(sync.validation.decision, "fail");
    const subtitle = sync.latestSubtitleReport!;
    assert.notEqual(subtitle.qualityValidation.status, "fail");
    assert.equal(subtitle.qualityValidation.transcriptValidated, true);
    assert.ok(Array.isArray(subtitle.syncIssues));
  });

  test("7 supports multiple subtitle languages", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.supportMultipleSubtitleLanguages(baseInput);
    assert.equal(report.action, "support_multiple_subtitle_languages");
    assert.notEqual(report.validation.decision, "fail");
    const subtitle = report.latestSubtitleReport!;
    assert.ok(subtitle.languages.length >= 2);
    assert.ok(subtitle.languages.includes("en-US"));
  });

  test("8 produces Subtitle Report with all required fields", async () => {
    const engine = await build();
    receiveAll(engine);
    const { subtitleReportId: _omit, ...reportInput } = baseInput;
    const report = engine.produceSubtitleReport(reportInput);
    const subtitle = report.latestSubtitleReport!;
    assert.ok(subtitle.subtitleReportId.startsWith("stw-rpt-"));
    assert.ok(subtitle.timestamp);
    assert.equal(subtitle.videoId, "vid-vaw-001");
    assert.equal(subtitle.scriptId, "scw-scr-001");
    assert.ok(subtitle.transcript.length > 0);
    assert.equal(subtitle.subtitleLanguage, "en-US");
    assert.ok(subtitle.captionTimeline.length >= 1);
    assert.ok(subtitle.timingAccuracy);
    assert.ok(subtitle.exportFormats.length >= 2);
    assert.ok(subtitle.qualityValidation.status);
    assert.equal(subtitle.metadataVersion, STW_METADATA_VERSION);
    assert.equal(subtitle.reportVersion, STW_REPORT_VERSION);
    assert.equal(subtitle.neverRewriteScripts, true);
    assert.equal(subtitle.neverAssembleVideos, true);
    assert.equal(subtitle.neverPublishContent, true);
    assert.equal(subtitle.neverOverridePillow, true);
    assert.equal(subtitle.neverOverrideGrandKing, true);
    assert.equal(subtitle.neverImplementQ413OrLater, true);
    assert.equal(subtitle.neverModifyApprovedScripts, true);
    assert.equal(subtitle.preserveScriptTraceability, true);
    assert.equal(subtitle.structuralSignalOnly, true);
    assert.ok(subtitle.traceabilityRefs.length >= 1);
    assert.ok(subtitle.transcriptHistory.length >= 1);
  });

  test("9 rejects rewrite/assemble/publish/override/modify/Q4-13", async () => {
    const engine = await build();
    receiveAll(engine);
    for (const forbidden of [
      { rewriteScripts: true },
      { assembleVideos: true },
      { publishContent: true },
      { publishMedia: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ413OrLater: true },
      { modifyApprovedScripts: true },
    ] as const) {
      const report = engine.produceSubtitleReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestSubtitleReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createSubtitleWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-stw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    receiveAll(engine);
    const produced = engine.produceSubtitleReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.subtitleReports.length >= 1);
    const submitted = engine.submitReport({
      subtitleReportId: produced.latestSubtitleReport!.subtitleReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-12"]);
    assert.equal(submitted.latestSubtitleReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestSubtitleReport!.executiveReportId, "ert-worker-stw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-12");
    assert.equal(cockpit.neverPublishContent, true);
    assert.equal(cockpit.neverAssembleVideos, true);
  });
});
