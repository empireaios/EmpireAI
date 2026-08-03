import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ASSET_TYPES,
  CONTENT_FORMATS,
  COPYRIGHT_STATUSES,
  COVERAGE_STATUSES,
  USAGE_RIGHTS,
  VRW_CAPABILITIES,
  VRW_INTEGRATION_TARGETS,
  VRW_METADATA_VERSION,
  VRW_REPORT_VERSION,
  buildVisualResearchWorkerConfiguration,
  createVisualResearchWorker,
  resetVisualResearchWorkerForTesting,
} from "../../visual-research-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createVisualResearchWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createVisualResearchWorker(bootstrap, config);
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
  scriptIntent: "Educate startup founders on practical AI workflows with supporting visuals",
  scriptSections: [
    { sectionId: "intro", title: "Introduction", content: "Opening context on AI productivity" },
    { sectionId: "core", title: "Core workflow data", content: "Data-driven workflow diagram and demo" },
    { sectionId: "close", title: "Conclusion", content: "Closing summary with archive historical context" },
  ],
  thumbnailReportId: "thw-rpt-001",
  candidateAssets: [
    { assetId: "int-001", source: "internal_generated", assetType: "original_generated_graphic" },
  ],
  validated: true,
};

describe("Q4-08 Visual Research Worker", () => {
  beforeEach(resetVisualResearchWorkerForTesting);

  test("1 locks mandatory visual-research-worker boundaries", () => {
    const c = buildVisualResearchWorkerConfiguration(REPO_ROOT, {
      neverGenerateFinalCreativeAssets: false as never,
      neverEditImages: false as never,
      neverAssembleVideos: false as never,
      neverPublishContent: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ409OrLater: false as never,
      useOnlyApprovedVisualSources: false as never,
    });
    assert.equal(c.neverGenerateFinalCreativeAssets, true);
    assert.equal(c.neverEditImages, true);
    assert.equal(c.neverAssembleVideos, true);
    assert.equal(c.neverPublishContent, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ409OrLater, true);
    assert.equal(c.useOnlyApprovedVisualSources, true);
    assert.equal(c.preserveCompleteAssetTraceability, true);
    assert.equal(c.preserveCopyrightInformation, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-VRW-001 for Q4-08 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-08");
    assert.equal(state.engineVersion, "PILLOW-VRW-001");
    assert.equal(state.configuration.workerId, "wkr-visual-research-01");
    assert.equal(state.configuration.role, "role-researcher-visual-research");
    for (const target of VRW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const format of CONTENT_FORMATS) {
      assert.ok(typeof format === "string");
    }
    for (const assetType of ASSET_TYPES) {
      assert.ok(typeof assetType === "string");
    }
    for (const status of COPYRIGHT_STATUSES) {
      assert.ok(typeof status === "string");
    }
    for (const rights of USAGE_RIGHTS) {
      assert.ok(typeof rights === "string");
    }
    for (const coverage of COVERAGE_STATUSES) {
      assert.ok(typeof coverage === "string");
    }
    assert.ok(VRW_CAPABILITIES.includes("break_scripts_into_visual_scenes"));
    assert.ok(VRW_CAPABILITIES.includes("produce_machine_readable_visual_research_reports"));
    assert.ok(VRW_CAPABILITIES.includes("integrate_thumbnail_worker"));
  });

  test("3 script analysed / scenes broken", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.breakIntoVisualScenes(scriptInput);
    assert.equal(report.action, "break_into_visual_scenes");
    assert.notEqual(report.validation.decision, "fail");
    const ctx = engine.getEngineRecord();
    assert.ok(ctx);
  });

  test("4 visual requirements identified", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    engine.breakIntoVisualScenes(scriptInput);
    const report = engine.identifyRequiredVisualAssets(scriptInput);
    assert.equal(report.action, "identify_required_visual_assets");
    assert.notEqual(report.validation.decision, "fail");
  });

  test("5 assets discovered (stock/public domain/internal)", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    engine.breakIntoVisualScenes(scriptInput);
    engine.identifyRequiredVisualAssets(scriptInput);
    const stock = engine.searchApprovedStockLibraries(scriptInput);
    assert.equal(stock.action, "search_approved_stock_libraries");
    assert.notEqual(stock.validation.decision, "fail");
    const pd = engine.searchPublicDomainSources(scriptInput);
    assert.equal(pd.action, "search_public_domain_sources");
    assert.notEqual(pd.validation.decision, "fail");
    const internal = engine.identifyInternallyGeneratedAssets(scriptInput);
    assert.equal(internal.action, "identify_internally_generated_assets");
    assert.notEqual(internal.validation.decision, "fail");
  });

  test("6 copyright classified", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    engine.breakIntoVisualScenes(scriptInput);
    engine.searchApprovedStockLibraries(scriptInput);
    const report = engine.classifyCopyrightStatus(scriptInput);
    assert.equal(report.action, "classify_copyright_status");
    assert.notEqual(report.validation.decision, "fail");
  });

  test("7 timeline mapped", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    engine.breakIntoVisualScenes(scriptInput);
    const report = engine.matchVisualsToScriptTimeline(scriptInput);
    assert.equal(report.action, "match_visuals_to_script_timeline");
    assert.notEqual(report.validation.decision, "fail");
  });

  test("8 produces Visual Research Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    const report = engine.produceVisualResearchReport(scriptInput);
    const vrwReport = report.latestVisualResearchReport!;
    assert.ok(vrwReport.visualResearchId.startsWith("vrw-rpt-"));
    assert.ok(vrwReport.timestamp);
    assert.equal(vrwReport.scriptId, "scw-scr-001");
    assert.equal(vrwReport.channelId, "chn-youtube-insights-01");
    assert.equal(vrwReport.thumbnailReportId, "thw-rpt-001");
    assert.equal(vrwReport.topicId, "topic-ai-productivity-01");
    assert.equal(vrwReport.contentFormat, "explainer");
    assert.ok(vrwReport.sceneNumber >= 1);
    assert.ok(vrwReport.requiredVisual);
    assert.ok(vrwReport.visualSource);
    assert.ok(vrwReport.assetType);
    assert.ok(vrwReport.copyrightStatus);
    assert.ok(vrwReport.usageRights);
    assert.ok(vrwReport.timelinePosition);
    assert.ok(vrwReport.coverageStatus);
    assert.ok(vrwReport.scenes.length >= 3);
    for (const scene of vrwReport.scenes) {
      assert.ok(scene.sceneNumber);
      assert.ok(scene.requiredVisual);
      assert.ok(scene.timelinePosition);
    }
    assert.ok(vrwReport.confidenceScore > 0);
    assert.equal(vrwReport.metadataVersion, VRW_METADATA_VERSION);
    assert.equal(vrwReport.reportVersion, VRW_REPORT_VERSION);
    assert.equal(vrwReport.neverGenerateFinalCreativeAssets, true);
    assert.equal(vrwReport.neverEditImages, true);
    assert.equal(vrwReport.neverAssembleVideos, true);
    assert.equal(vrwReport.neverPublishContent, true);
    assert.equal(vrwReport.neverOverridePillow, true);
    assert.equal(vrwReport.neverOverrideGrandKing, true);
    assert.equal(vrwReport.neverImplementQ409OrLater, true);
    assert.equal(vrwReport.useOnlyApprovedVisualSources, true);
    assert.ok(vrwReport.traceabilityRefs.length >= 1);
    assert.ok(vrwReport.preservedDecisions.length >= 1);
  });

  test("9 rejects final-creative/edit/assemble/publish/override/Q4-09/unapproved source", async () => {
    const engine = await build();
    engine.receiveApprovedScript(scriptInput);
    for (const forbidden of [
      { generateFinalCreativeAssets: true },
      { editImages: true },
      { assembleVideos: true },
      { publishContent: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ409OrLater: true },
      { useUnapprovedVisualSource: true },
    ] as const) {
      const report = engine.produceVisualResearchReport({
        ...scriptInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestVisualResearchReport, null);
    }
    const unapproved = engine.produceVisualResearchReport({
      ...scriptInput,
      unapprovedSource: "random_pirate_site",
    });
    assert.equal(unapproved.validation.decision, "fail");
    assert.equal(unapproved.latestVisualResearchReport, null);
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createVisualResearchWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-vrw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedScript(scriptInput);
    const produced = engine.produceVisualResearchReport(scriptInput);
    const listed = engine.list();
    assert.ok(listed.visualResearchReports.length >= 1);
    const submitted = engine.submitReport({
      visualResearchId: produced.latestVisualResearchReport!.visualResearchId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-08"]);
    assert.equal(submitted.latestVisualResearchReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestVisualResearchReport!.executiveReportId, "ert-worker-vrw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-08");
    assert.equal(cockpit.neverGenerateFinalCreativeAssets, true);
    assert.equal(cockpit.neverPublishContent, true);
  });
});
