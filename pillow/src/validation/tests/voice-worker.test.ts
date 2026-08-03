import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  VOICE_CAPABILITIES_CATALOG,
  VOICE_LANGUAGES,
  VOICE_PROFILES,
  VOW_CAPABILITIES,
  VOW_INTEGRATION_TARGETS,
  VOW_METADATA_VERSION,
  VOW_REPORT_VERSION,
  buildVoiceWorkerConfiguration,
  createVoiceWorker,
  resetVoiceWorkerForTesting,
} from "../../voice-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createVoiceWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createVoiceWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  voiceReportId: "vow-asset-001",
  scriptId: "scw-scr-001",
  channelId: "chn-youtube-insights-01",
  topicId: "tpw-topic-001",
  voiceProfile: "narrator_neutral" as const,
  language: "en-US" as const,
  speakingSpeed: 1.05,
  tone: "warm" as const,
  emotionalStyle: "curious" as const,
  pauseControlMs: 400,
  pronunciationControls: ["EmpireAI", "Pillow"],
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

describe("Q4-10 Voice Worker", () => {
  beforeEach(resetVoiceWorkerForTesting);

  test("1 locks mandatory voice-worker boundaries", () => {
    const c = buildVoiceWorkerConfiguration(REPO_ROOT, {
      neverRewriteScripts: false as never,
      neverAssembleVideos: false as never,
      neverPublishMedia: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ411OrLater: false as never,
      preserveScriptTraceability: false as never,
      preserveGeneratedVoiceAssetReferences: false as never,
      preserveVoiceConfigurationHistory: false as never,
      validateOutputQuality: false as never,
    });
    assert.equal(c.neverRewriteScripts, true);
    assert.equal(c.neverAssembleVideos, true);
    assert.equal(c.neverPublishMedia, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ411OrLater, true);
    assert.equal(c.preserveScriptTraceability, true);
    assert.equal(c.preserveGeneratedVoiceAssetReferences, true);
    assert.equal(c.preserveVoiceConfigurationHistory, true);
    assert.equal(c.validateOutputQuality, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-VOW-001 for Q4-10 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-10");
    assert.equal(state.engineVersion, "PILLOW-VOW-001");
    assert.equal(state.configuration.workerId, "wkr-voice-01");
    assert.equal(state.configuration.role, "role-creator-voice");
    for (const target of VOW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const profile of VOICE_PROFILES) {
      assert.ok(typeof profile === "string");
    }
    for (const language of VOICE_LANGUAGES) {
      assert.ok(typeof language === "string");
    }
    for (const capability of VOICE_CAPABILITIES_CATALOG) {
      assert.ok(typeof capability === "string");
    }
    assert.ok(VOW_CAPABILITIES.includes("receive_approved_scripts"));
    assert.ok(VOW_CAPABILITIES.includes("produce_machine_readable_voice_reports"));
    assert.ok(VOW_CAPABILITIES.includes("integrate_script_worker"));
  });

  test("3 receives approved script", async () => {
    const engine = await build();
    const report = engine.receiveApprovedScripts(baseInput);
    assert.equal(report.action, "receive_approved_scripts");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(engine.getEngineRecord());
  });

  test("4 generates voice configuration", async () => {
    const engine = await build();
    engine.receiveApprovedScripts(baseInput);
    const report = engine.configureVoiceGenerationSettings(baseInput);
    assert.equal(report.action, "configure_voice_generation_settings");
    assert.notEqual(report.validation.decision, "fail");
    const voiceReport = report.latestVoiceReport!;
    assert.ok(voiceReport.voiceGenerationSettings.settingsId);
    assert.equal(voiceReport.voiceGenerationSettings.voiceProfile, "narrator_neutral");
    assert.equal(voiceReport.voiceGenerationSettings.language, "en-US");
    assert.equal(voiceReport.voiceGenerationSettings.speakingSpeed, 1.05);
    assert.ok(voiceReport.voiceGenerationSettings.pronunciationControls.length >= 1);
    assert.ok(voiceReport.configurationHistory.length >= 1);
  });

  test("5 generates voiceover assets", async () => {
    const engine = await build();
    engine.receiveApprovedScripts(baseInput);
    engine.configureVoiceGenerationSettings(baseInput);
    const report = engine.generateVoiceoverAssets(baseInput);
    assert.equal(report.action, "generate_voiceover_assets");
    assert.notEqual(report.validation.decision, "fail");
    const voiceReport = report.latestVoiceReport!;
    assert.ok(voiceReport.narrationSegments.length >= 2);
    assert.ok(voiceReport.voiceAssetReferences.length >= 2);
    for (const asset of voiceReport.voiceAssetReferences) {
      assert.ok(asset.assetId);
      assert.ok(asset.assetPath);
      assert.ok(asset.descriptor);
      assert.equal(asset.exportable, true);
    }
  });

  test("6 produces multiple voice variants", async () => {
    const engine = await build();
    engine.receiveApprovedScripts(baseInput);
    engine.configureVoiceGenerationSettings(baseInput);
    const report = engine.generateAlternateVoiceVersions(baseInput);
    assert.equal(report.action, "generate_alternate_voice_versions");
    assert.notEqual(report.validation.decision, "fail");
    const voiceReport = report.latestVoiceReport!;
    assert.ok(voiceReport.variantCount >= 2);
    assert.ok(voiceReport.variants.length >= 2);
    for (const variant of voiceReport.variants) {
      assert.ok(variant.variantId);
      assert.ok(variant.variantLabel);
      assert.ok(variant.voiceProfile);
      assert.ok(variant.assetId);
      assert.ok(variant.assetPath);
    }
  });

  test("7 quality validation completed", async () => {
    const engine = await build();
    engine.receiveApprovedScripts(baseInput);
    engine.generateVoiceoverAssets(baseInput);
    const report = engine.validateVoiceQuality(baseInput);
    assert.equal(report.action, "validate_voice_quality");
    assert.notEqual(report.validation.decision, "fail");
    const voiceReport = report.latestVoiceReport!;
    assert.notEqual(voiceReport.qualityStatus, "fail");
    assert.ok(voiceReport.qualityNotes.length > 0);
    assert.ok(voiceReport.confidenceScore >= 70);
    assert.equal(voiceReport.validateOutputQuality, true);
  });

  test("8 produces Voice Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedScripts(baseInput);
    engine.configureVoiceGenerationSettings(baseInput);
    const { voiceReportId: _omit, ...reportInput } = baseInput;
    const report = engine.produceVoiceReport(reportInput);
    const voiceReport = report.latestVoiceReport!;
    assert.ok(voiceReport.voiceReportId.startsWith("vow-rpt-"));
    assert.ok(voiceReport.timestamp);
    assert.equal(voiceReport.scriptId, "scw-scr-001");
    assert.equal(voiceReport.channelId, "chn-youtube-insights-01");
    assert.equal(voiceReport.voiceProfile, "narrator_neutral");
    assert.equal(voiceReport.language, "en-US");
    assert.ok(voiceReport.narrationSegments.length >= 2);
    assert.ok(voiceReport.voiceGenerationSettings.settingsId);
    assert.ok(voiceReport.voiceAssetReferences.length >= 1);
    assert.ok(voiceReport.qualityStatus);
    assert.ok(voiceReport.variantCount >= 2);
    assert.ok(voiceReport.confidenceScore >= 0);
    assert.equal(voiceReport.metadataVersion, VOW_METADATA_VERSION);
    assert.equal(voiceReport.reportVersion, VOW_REPORT_VERSION);
    assert.equal(voiceReport.neverRewriteScripts, true);
    assert.equal(voiceReport.neverAssembleVideos, true);
    assert.equal(voiceReport.neverPublishMedia, true);
    assert.equal(voiceReport.neverOverridePillow, true);
    assert.equal(voiceReport.neverOverrideGrandKing, true);
    assert.equal(voiceReport.neverImplementQ411OrLater, true);
    assert.equal(voiceReport.preserveScriptTraceability, true);
    assert.equal(voiceReport.structuralSignalOnly, true);
    assert.ok(voiceReport.traceabilityRefs.length >= 1);
    assert.ok(voiceReport.preservedDecisions.length >= 1);
  });

  test("9 rejects rewrite/assemble/publish/override/Q4-11", async () => {
    const engine = await build();
    engine.receiveApprovedScripts(baseInput);
    for (const forbidden of [
      { rewriteScripts: true },
      { assembleVideos: true },
      { publishMedia: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ411OrLater: true },
    ] as const) {
      const report = engine.produceVoiceReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestVoiceReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createVoiceWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-vow-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedScripts(baseInput);
    engine.configureVoiceGenerationSettings(baseInput);
    const produced = engine.produceVoiceReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.voiceReports.length >= 1);
    const submitted = engine.submitReport({
      voiceReportId: produced.latestVoiceReport!.voiceReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-10"]);
    assert.equal(submitted.latestVoiceReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestVoiceReport!.executiveReportId, "ert-worker-vow-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-10");
    assert.equal(cockpit.neverAssembleVideos, true);
    assert.equal(cockpit.neverPublishMedia, true);
  });
});
