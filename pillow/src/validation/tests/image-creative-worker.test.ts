import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CREATIVE_ASSET_TYPES,
  COPYRIGHT_STATUSES,
  ICW_CAPABILITIES,
  ICW_INTEGRATION_TARGETS,
  ICW_METADATA_VERSION,
  ICW_REPORT_VERSION,
  buildImageCreativeWorkerConfiguration,
  createImageCreativeWorker,
  resetImageCreativeWorkerForTesting,
} from "../../image-creative-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createImageCreativeWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createImageCreativeWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  creativeAssetId: "icw-asset-001",
  scriptId: "scw-scr-001",
  sceneId: "scene-intro-01",
  channelId: "chn-youtube-insights-01",
  visualResearchId: "vrw-rpt-001",
  thumbnailReportId: "thw-rpt-001",
  assetType: "illustration" as const,
  sourceAssets: [
    {
      assetId: "src-ref-001",
      assetPath: "assets/source/src-ref-001.descriptor.json",
      assetType: "reference_image",
      copyrightStatus: "original" as const,
      source: "internal_generated",
    },
  ],
  thumbnailSpecs: [
    {
      specId: "thw-concept-001",
      conceptId: "thw-concept-001",
      textOverlay: "What if AI productivity is incomplete?",
      composition: "rule_of_thirds_left",
      emotionalTrigger: "curiosity",
    },
  ],
  visualResearchScenes: [
    {
      sceneId: "scene-intro-01",
      sceneLabel: "Introduction",
      requiredAssets: ["hero_visual", "supporting_graphic"],
      copyrightStatus: "original",
    },
  ],
  editorialNotes: "Maintain navy and amber brand palette",
  validated: true,
};

describe("Q4-09 Image & Creative Worker", () => {
  beforeEach(resetImageCreativeWorkerForTesting);

  test("1 locks mandatory image-creative-worker boundaries", () => {
    const c = buildImageCreativeWorkerConfiguration(REPO_ROOT, {
      neverAssembleVideos: false as never,
      neverGenerateVoiceovers: false as never,
      neverPublishMedia: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ410OrLater: false as never,
      preserveCompleteAssetTraceability: false as never,
      respectCopyrightAndLicensing: false as never,
      preserveOriginalAssets: false as never,
      recordAllEditsPerformed: false as never,
      produceMultipleVariantsWhenAppropriate: false as never,
    });
    assert.equal(c.neverAssembleVideos, true);
    assert.equal(c.neverGenerateVoiceovers, true);
    assert.equal(c.neverPublishMedia, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ410OrLater, true);
    assert.equal(c.preserveCompleteAssetTraceability, true);
    assert.equal(c.respectCopyrightAndLicensing, true);
    assert.equal(c.preserveOriginalAssets, true);
    assert.equal(c.recordAllEditsPerformed, true);
    assert.equal(c.produceMultipleVariantsWhenAppropriate, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-ICW-001 for Q4-09 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-09");
    assert.equal(state.engineVersion, "PILLOW-ICW-001");
    assert.equal(state.configuration.workerId, "wkr-image-creative-01");
    assert.equal(state.configuration.role, "role-creator-image-creative");
    for (const target of ICW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const assetType of CREATIVE_ASSET_TYPES) {
      assert.ok(typeof assetType === "string");
    }
    for (const status of COPYRIGHT_STATUSES) {
      assert.ok(typeof status === "string");
    }
    assert.ok(ICW_CAPABILITIES.includes("generate_original_graphics"));
    assert.ok(ICW_CAPABILITIES.includes("produce_machine_readable_creative_asset_reports"));
    assert.ok(ICW_CAPABILITIES.includes("integrate_visual_research_worker"));
    assert.ok(ICW_CAPABILITIES.includes("integrate_thumbnail_worker"));
  });

  test("3 receives Visual Research Report", async () => {
    const engine = await build();
    const report = engine.receiveVisualResearchReport(baseInput);
    assert.equal(report.action, "receive_visual_research_report");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(engine.getEngineRecord());
  });

  test("4 generates creative assets", async () => {
    const engine = await build();
    engine.receiveVisualResearchReport(baseInput);
    const report = engine.generateOriginalGraphics(baseInput);
    assert.equal(report.action, "generate_original_graphics");
    assert.notEqual(report.validation.decision, "fail");
    const creativeReport = report.latestCreativeAssetReport!;
    assert.ok(creativeReport.generatedAssets.length >= 2);
    for (const asset of creativeReport.generatedAssets) {
      const ref = typeof asset === "string" ? { assetId: asset } : asset;
      assert.ok(ref.assetId);
      if (typeof asset !== "string") {
        assert.ok(asset.assetPath);
        assert.ok(asset.descriptor);
        assert.ok(asset.assetType);
      }
    }
  });

  test("5 edits existing images (records edit ops)", async () => {
    const engine = await build();
    engine.receiveVisualResearchReport(baseInput);
    const report = engine.editExistingImages(baseInput);
    assert.equal(report.action, "edit_existing_images");
    assert.notEqual(report.validation.decision, "fail");
    const creativeReport = report.latestCreativeAssetReport!;
    assert.ok(creativeReport.editOperations.length >= 2);
    for (const op of creativeReport.editOperations) {
      assert.ok(op.operationId);
      assert.ok(op.operationType);
      assert.ok(op.description);
      assert.ok(op.appliedTo);
    }
    assert.equal(creativeReport.recordAllEditsPerformed, true);
  });

  test("6 produces multiple variants", async () => {
    const engine = await build();
    engine.receiveVisualResearchReport(baseInput);
    engine.receiveThumbnailSpecifications(baseInput);
    const report = engine.generateMultipleCreativeVariants(baseInput);
    assert.equal(report.action, "generate_multiple_creative_variants");
    assert.notEqual(report.validation.decision, "fail");
    const creativeReport = report.latestCreativeAssetReport!;
    assert.ok(creativeReport.variantCount >= 2);
    assert.ok(creativeReport.variants.length >= 2);
    for (const variant of creativeReport.variants) {
      assert.ok(variant.variantId);
      assert.ok(variant.variantLabel);
      assert.ok(variant.assetId);
      assert.ok(variant.assetPath);
      assert.ok(variant.descriptor);
    }
  });

  test("7 copyright compliance verified", async () => {
    const engine = await build();
    engine.receiveVisualResearchReport(baseInput);
    engine.generateOriginalGraphics(baseInput);
    const report = engine.validateAssetQualityAndCompliance(baseInput);
    assert.equal(report.action, "validate_asset_quality_and_compliance");
    assert.notEqual(report.validation.decision, "fail");
    const creativeReport = report.latestCreativeAssetReport!;
    assert.ok(COPYRIGHT_STATUSES.includes(creativeReport.copyrightStatus));
    assert.notEqual(creativeReport.qualityStatus, "fail");
    assert.ok(creativeReport.complianceNotes.length > 0);
    assert.equal(creativeReport.respectCopyrightAndLicensing, true);
  });

  test("8 produces Creative Asset Report with all required fields", async () => {
    const engine = await build();
    engine.receiveVisualResearchReport(baseInput);
    engine.receiveThumbnailSpecifications(baseInput);
    const { creativeAssetId: _omit, ...reportInput } = baseInput;
    const report = engine.produceCreativeAssetReport(reportInput);
    const creativeReport = report.latestCreativeAssetReport!;
    assert.ok(creativeReport.creativeAssetId.startsWith("icw-rpt-"));
    assert.ok(creativeReport.timestamp);
    assert.equal(creativeReport.scriptId, "scw-scr-001");
    assert.equal(creativeReport.sceneId, "scene-intro-01");
    assert.equal(creativeReport.channelId, "chn-youtube-insights-01");
    assert.equal(creativeReport.visualResearchId, "vrw-rpt-001");
    assert.equal(creativeReport.thumbnailReportId, "thw-rpt-001");
    assert.equal(creativeReport.assetType, "illustration");
    assert.ok(creativeReport.sourceAssets.length >= 1);
    assert.ok(creativeReport.generatedAssets.length >= 1);
    assert.ok(creativeReport.editOperations.length >= 1);
    assert.ok(creativeReport.qualityStatus);
    assert.ok(creativeReport.copyrightStatus);
    assert.ok(creativeReport.variantCount >= 2);
    assert.equal(creativeReport.metadataVersion, ICW_METADATA_VERSION);
    assert.equal(creativeReport.reportVersion, ICW_REPORT_VERSION);
    assert.equal(creativeReport.neverAssembleVideos, true);
    assert.equal(creativeReport.neverGenerateVoiceovers, true);
    assert.equal(creativeReport.neverPublishMedia, true);
    assert.equal(creativeReport.neverOverridePillow, true);
    assert.equal(creativeReport.neverOverrideGrandKing, true);
    assert.equal(creativeReport.neverImplementQ410OrLater, true);
    assert.equal(creativeReport.preserveCompleteAssetTraceability, true);
    assert.equal(creativeReport.structuralSignalOnly, true);
    assert.ok(creativeReport.traceabilityRefs.length >= 1);
    assert.ok(creativeReport.preservedDecisions.length >= 1);
  });

  test("9 rejects assemble/voiceover/publish/override/Q4-10", async () => {
    const engine = await build();
    engine.receiveVisualResearchReport(baseInput);
    for (const forbidden of [
      { assembleVideos: true },
      { generateVoiceovers: true },
      { publishMedia: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ410OrLater: true },
    ] as const) {
      const report = engine.produceCreativeAssetReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestCreativeAssetReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createImageCreativeWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-icw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveVisualResearchReport(baseInput);
    engine.receiveThumbnailSpecifications(baseInput);
    const produced = engine.produceCreativeAssetReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.creativeAssetReports.length >= 1);
    const submitted = engine.submitReport({
      creativeAssetId: produced.latestCreativeAssetReport!.creativeAssetId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-09"]);
    assert.equal(submitted.latestCreativeAssetReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestCreativeAssetReport!.executiveReportId, "ert-worker-icw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-09");
    assert.equal(cockpit.neverAssembleVideos, true);
    assert.equal(cockpit.neverPublishMedia, true);
  });
});
