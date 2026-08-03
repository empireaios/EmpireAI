import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CONTENT_FORMATS,
  DESIGN_ELEMENTS,
  EMOTIONAL_TRIGGERS,
  THW_CAPABILITIES,
  THW_INTEGRATION_TARGETS,
  THW_METADATA_VERSION,
  THW_REPORT_VERSION,
  buildThumbnailWorkerConfiguration,
  createThumbnailWorker,
  resetThumbnailWorkerForTesting,
} from "../../thumbnail-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createThumbnailWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createThumbnailWorker(bootstrap, config);
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
  scriptIntent: "Educate startup founders on practical AI workflows without misleading thumbnail claims",
  targetAudience: "Startup founders and product leaders",
  hookReportId: "hkw-rpt-001",
  primaryHookText: "What if everything founders believe about AI productivity is incomplete?",
  alternativeHookTexts: [
    "There's a hidden pattern in AI productivity that most founders never notice.",
    "Here's what the data reveals about AI productivity for startup leaders.",
  ],
  editorialStrategy: "Educational authority with practical takeaways",
  channelIdentity: "Insights channel — navy and amber palette",
  validated: true,
};

describe("Q4-07 Thumbnail Worker", () => {
  beforeEach(resetThumbnailWorkerForTesting);

  test("1 locks mandatory thumbnail-worker boundaries", () => {
    const c = buildThumbnailWorkerConfiguration(REPO_ROOT, {
      neverGenerateFinalArtwork: false as never,
      neverEditImagesDirectly: false as never,
      neverPublishThumbnails: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ408OrLater: false as never,
      neverUseMisleadingOrDeceptiveThumbnails: false as never,
      followEditorInChiefStrategy: false as never,
      remainConsistentWithApprovedScript: false as never,
      produceMultipleDesignAlternatives: false as never,
    });
    assert.equal(c.neverGenerateFinalArtwork, true);
    assert.equal(c.neverEditImagesDirectly, true);
    assert.equal(c.neverPublishThumbnails, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ408OrLater, true);
    assert.equal(c.neverUseMisleadingOrDeceptiveThumbnails, true);
    assert.equal(c.followEditorInChiefStrategy, true);
    assert.equal(c.remainConsistentWithApprovedScript, true);
    assert.equal(c.produceMultipleDesignAlternatives, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-THW-001 for Q4-07 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-07");
    assert.equal(state.engineVersion, "PILLOW-THW-001");
    assert.equal(state.configuration.workerId, "wkr-thumbnail-01");
    assert.equal(state.configuration.role, "role-creator-thumbnail-worker");
    for (const target of THW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const format of CONTENT_FORMATS) {
      assert.ok(typeof format === "string");
    }
    for (const element of DESIGN_ELEMENTS) {
      assert.ok(typeof element === "string");
    }
    for (const trigger of EMOTIONAL_TRIGGERS) {
      assert.ok(typeof trigger === "string");
    }
    assert.ok(THW_CAPABILITIES.includes("generate_thumbnail_concepts"));
    assert.ok(THW_CAPABILITIES.includes("produce_machine_readable_thumbnail_reports"));
    assert.ok(THW_CAPABILITIES.includes("integrate_hook_worker"));
  });

  test("3 receives script", async () => {
    const engine = await build();
    const report = engine.receiveApprovedScript(scriptInput);
    assert.equal(report.action, "receive_approved_script");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(engine.getEngineRecord());
  });

  test("4 generates thumbnail concepts", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.generateThumbnailConcepts(scriptInput);
    assert.equal(report.action, "generate_thumbnail_concepts");
    assert.notEqual(report.validation.decision, "fail");
    const thumbReport = report.latestThumbnailReport!;
    assert.ok(thumbReport.thumbnailConcepts.length >= 2);
    for (const concept of thumbReport.thumbnailConcepts) {
      assert.ok(concept.conceptId);
      assert.ok(concept.title);
      assert.ok(concept.subjectFocus);
      assert.ok(concept.composition);
      assert.ok(concept.textOverlay);
      assert.ok(concept.emotionalTrigger);
      assert.ok(concept.contrast);
      assert.ok(concept.colourGuidance);
      assert.ok(concept.visualHierarchy);
      assert.ok(concept.curiosityElement);
      assert.ok(concept.brandingConsistency);
      assert.ok(concept.rationale);
    }
    assert.ok(thumbReport.primaryConcept.conceptId);
  });

  test("5 generates A/B variants", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.generateAbVariants(scriptInput);
    assert.equal(report.action, "generate_ab_variants");
    assert.notEqual(report.validation.decision, "fail");
    const variants = report.latestThumbnailReport!.abVariants;
    assert.ok(variants.length >= 2);
    const labels = new Set(variants.map((v) => v.label));
    assert.ok(labels.has("A"));
    assert.ok(labels.has("B"));
    for (const variant of variants) {
      assert.ok(variant.variantId);
      assert.ok(variant.textOverlay);
      assert.ok(variant.emotionalTrigger);
      assert.ok(variant.composition);
      assert.ok(variant.differentiation);
    }
  });

  test("6 generates emotional triggers", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.generateEmotionalTriggers(scriptInput);
    assert.equal(report.action, "generate_emotional_triggers");
    assert.notEqual(report.validation.decision, "fail");
    const triggers = report.latestThumbnailReport!.emotionalTriggers;
    assert.ok(triggers.length >= 2);
    for (const trigger of triggers) {
      assert.ok(trigger.triggerId);
      assert.ok(EMOTIONAL_TRIGGERS.includes(trigger.trigger));
      assert.ok(trigger.expression.trim().length > 0);
      assert.ok(trigger.placement);
    }
  });

  test("7 generates text overlays", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.generateTextOverlaySuggestions(scriptInput);
    assert.equal(report.action, "generate_text_overlay_suggestions");
    assert.notEqual(report.validation.decision, "fail");
    const overlays = report.latestThumbnailReport!.textOverlays;
    assert.ok(overlays.length >= 2);
    for (const overlay of overlays) {
      assert.ok(overlay.overlayId);
      assert.ok(overlay.text.trim().length > 0);
      assert.ok(overlay.text.length <= overlay.maxCharacters);
      assert.ok(overlay.placement);
    }
  });

  test("8 produces Thumbnail Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    engine.receiveApprovedHooks(scriptInput);
    const report = engine.produceThumbnailReport(scriptInput);
    const thumbReport = report.latestThumbnailReport!;
    assert.ok(thumbReport.thumbnailReportId.startsWith("thw-rpt-"));
    assert.ok(thumbReport.timestamp);
    assert.equal(thumbReport.scriptId, "scw-scr-001");
    assert.equal(thumbReport.channelId, "chn-youtube-insights-01");
    assert.equal(thumbReport.hookReportId, "hkw-rpt-001");
    assert.equal(thumbReport.topicId, "topic-ai-productivity-01");
    assert.equal(thumbReport.contentFormat, "explainer");
    assert.ok(thumbReport.thumbnailConcepts.length >= 2);
    assert.ok(thumbReport.primaryConcept.conceptId);
    assert.ok(thumbReport.abVariants.length >= 2);
    assert.ok(thumbReport.textOverlays.length >= 2);
    assert.ok(thumbReport.emotionalTriggers.length >= 2);
    assert.ok(thumbReport.compositionGuidance.framing);
    assert.ok(thumbReport.scriptConsistencyStatus);
    assert.ok(thumbReport.brandingNotes);
    assert.ok(thumbReport.selfReviewSummary);
    assert.ok(thumbReport.confidenceScore > 0);
    assert.equal(thumbReport.metadataVersion, THW_METADATA_VERSION);
    assert.equal(thumbReport.reportVersion, THW_REPORT_VERSION);
    assert.equal(thumbReport.neverGenerateFinalArtwork, true);
    assert.equal(thumbReport.neverEditImagesDirectly, true);
    assert.equal(thumbReport.neverPublishThumbnails, true);
    assert.equal(thumbReport.neverOverridePillow, true);
    assert.equal(thumbReport.neverOverrideGrandKing, true);
    assert.equal(thumbReport.neverImplementQ408OrLater, true);
    assert.equal(thumbReport.neverUseMisleadingOrDeceptiveThumbnails, true);
    assert.equal(thumbReport.followEditorInChiefStrategy, true);
    assert.equal(thumbReport.remainConsistentWithApprovedScript, true);
    assert.equal(thumbReport.produceMultipleDesignAlternatives, true);
    assert.ok(thumbReport.traceabilityRefs.length >= 1);
    assert.ok(thumbReport.preservedDecisions.length >= 1);
  });

  test("9 rejects final-artwork/edit/publish/override/Q4-08/misleading", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    for (const forbidden of [
      { generateFinalArtwork: true },
      { editImagesDirectly: true },
      { publishThumbnails: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ408OrLater: true },
      { useMisleadingThumbnails: true },
    ] as const) {
      const report = engine.produceThumbnailReport({
        ...scriptInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestThumbnailReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createThumbnailWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-thw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedScript(scriptInput);
    const produced = engine.produceThumbnailReport(scriptInput);
    const listed = engine.list();
    assert.ok(listed.thumbnailReports.length >= 1);
    const submitted = engine.submitReport({
      thumbnailReportId: produced.latestThumbnailReport!.thumbnailReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-07"]);
    assert.equal(submitted.latestThumbnailReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestThumbnailReport!.executiveReportId, "ert-worker-thw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-07");
    assert.equal(cockpit.neverGenerateFinalArtwork, true);
    assert.equal(cockpit.neverPublishThumbnails, true);
  });
});
