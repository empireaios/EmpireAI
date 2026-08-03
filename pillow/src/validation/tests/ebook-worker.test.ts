import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EBW_CAPABILITIES,
  EBW_INTEGRATION_TARGETS,
  EBW_METADATA_VERSION,
  EBW_PRODUCT_TYPES,
  EBOOK_REPORT_VERSION,
  buildEbookWorkerConfiguration,
  createEbookWorker,
  resetEbookWorkerForTesting,
} from "../../ebook-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createEbookWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEbookWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const researchInput = {
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-toolkit-01",
  factoryMissionId: "dpf-dpm-toolkit-01",
  productTitle: "Freelancer Client Onboarding Toolkit",
  productType: "ebook" as const,
  targetAudience: "Solo freelancers and consultants",
  customerPainPoints: [
    "Fragmented client onboarding across too many tools",
    "No reusable written playbook for kickoff",
  ],
  marketGap: "Affordable written onboarding playbook for freelancers",
  demandAssessment: "High demand for structured freelancer onboarding guides",
  researchTopic: "Freelance client onboarding ebook",
  validated: true,
};

const fullInput = {
  ...researchInput,
  productType: "guide" as const,
  validated: true,
};

describe("Q5-03 Ebook Worker", () => {
  beforeEach(resetEbookWorkerForTesting);

  test("1 locks mandatory ebook-worker boundaries", () => {
    const c = buildEbookWorkerConfiguration(REPO_ROOT, {
      neverBuildSalesPages: false as never,
      neverProcessPayments: false as never,
      neverDeliverProductsToCustomers: false as never,
      neverPublishProductsDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ504OrLater: false as never,
      followApprovedProductResearch: false as never,
      followApprovedProductIntent: false as never,
    });
    assert.equal(c.neverBuildSalesPages, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverDeliverProductsToCustomers, true);
    assert.equal(c.neverPublishProductsDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ504OrLater, true);
    assert.equal(c.followApprovedProductResearch, true);
    assert.equal(c.followApprovedProductIntent, true);
  });

  test("2 initializes PILLOW-EBW-001 for Q5-03 with DPF + DPR integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-03");
    assert.equal(state.engineVersion, "PILLOW-EBW-001");
    assert.equal(state.configuration.workerId, "wkr-ebook-01");
    for (const target of EBW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("digital_product_research_worker"));
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    for (const type of EBW_PRODUCT_TYPES) {
      assert.ok(state.configuration.supportedProductTypes.includes(type));
    }
    assert.ok(EBW_CAPABILITIES.includes("receive_approved_digital_product_research"));
    assert.ok(EBW_CAPABILITIES.includes("produce_machine_readable_ebook_reports"));
  });

  test("3 receives approved digital product research", async () => {
    const report = (await build()).receiveApprovedDigitalProductResearch(researchInput);
    assert.equal(report.action, "receive_approved_digital_product_research");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestEbook!.researchReportId, "dpr-rsh-001");
    assert.equal(report.latestEbook!.opportunityId, "dpr-opp-001");
    assert.ok(report.latestEbook!.ebookId.startsWith("ebw-ebk-"));
  });

  test("4 creates product outline and chapter structure", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    const outline = engine.createProductOutline(fullInput);
    assert.equal(outline.action, "create_product_outline");
    assert.ok(outline.latestEbook!.outline);
    assert.ok(outline.latestEbook!.outline!.tableOfContents.length >= 1);

    const chapters = engine.createChapterStructure(fullInput);
    assert.equal(chapters.action, "create_chapter_structure");
    assert.ok(chapters.latestEbook!.chapterStructure.length >= 1);
  });

  test("5 generates written content for multiple product types", async () => {
    assert.ok(EBW_PRODUCT_TYPES.includes("ebook"));
    assert.ok(EBW_PRODUCT_TYPES.includes("guide"));
    assert.ok(EBW_PRODUCT_TYPES.includes("workbook"));

    const ebookEngine = await build();
    ebookEngine.receiveApprovedDigitalProductResearch({
      ...researchInput,
      productType: "ebook",
    });
    ebookEngine.createProductOutline({ ...fullInput, productType: "ebook" });
    ebookEngine.createChapterStructure({ ...fullInput, productType: "ebook" });
    const ebook = ebookEngine.generateCompleteWrittenContent({
      ...fullInput,
      productType: "ebook",
    });
    assert.equal(ebook.action, "generate_complete_written_content");
    assert.equal(ebook.latestEbook!.productType, "ebook");
    assert.ok(ebook.latestEbook!.chapters.length >= 1);
    assert.ok(ebook.latestEbook!.wordCount > 0);

    resetEbookWorkerForTesting();
    const guideEngine = await build();
    const received = guideEngine.receiveApprovedDigitalProductResearch({
      researchReportId: "dpr-rsh-guide-01",
      opportunityId: "dpr-opp-guide-01",
      businessId: "dbiz-guide-01",
      factoryMissionId: "dpf-dpm-guide-01",
      productTitle: "Freelancer Client Onboarding Guide",
      productType: "guide",
      targetAudience: "Solo freelancers and consultants",
      researchTopic: "Freelance client onboarding guide",
      validated: true,
    });
    assert.equal(received.latestEbook!.productType, "guide");
    guideEngine.createProductOutline({
      productType: "guide",
      productTitle: "Freelancer Client Onboarding Guide",
      validated: true,
    });
    guideEngine.createChapterStructure({ productType: "guide", validated: true });
    const guide = guideEngine.generateCompleteWrittenContent({
      productType: "guide",
      validated: true,
    });
    assert.equal(guide.latestEbook!.productType, "guide");
    assert.ok(guide.latestEbook!.chapters.length >= 1);
  });

  test("6 generates resources, references, and applies formatting", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.createProductOutline(fullInput);
    engine.createChapterStructure(fullInput);
    engine.generateCompleteWrittenContent(fullInput);

    const resources = engine.generateTablesChecklistsAndSummaries(fullInput);
    assert.equal(resources.action, "generate_tables_checklists_summaries");
    assert.ok(resources.latestEbook!.includedResources.length >= 1);

    const refs = engine.generateReferencesAndAppendices(fullInput);
    assert.equal(refs.action, "generate_references_and_appendices");
    assert.ok(
      refs.latestEbook!.includedResources.some(
        (r) => r.toLowerCase().includes("reference") || r.toLowerCase().includes("appendix"),
      ),
    );

    const formatted = engine.applyConsistentFormatting(fullInput);
    assert.equal(formatted.action, "apply_consistent_formatting");
    assert.equal(formatted.latestEbook!.formattingApplied, true);
  });

  test("7 performs self-review and prepares export-ready assets", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.createProductOutline(fullInput);
    engine.createChapterStructure(fullInput);
    engine.generateCompleteWrittenContent(fullInput);
    engine.generateTablesChecklistsAndSummaries(fullInput);
    engine.applyConsistentFormatting(fullInput);

    const review = engine.performSelfReview(fullInput);
    assert.equal(review.action, "perform_self_review");
    assert.ok(review.latestEbook!.qualityReview.length > 0);
    assert.ok(typeof review.latestEbook!.selfReviewPassed === "boolean");
    assert.ok(review.latestEbook!.confidenceScore > 0);

    const exportReady = engine.prepareExportReadyEbookAssets(fullInput);
    assert.equal(exportReady.action, "prepare_export_ready_ebook_assets");
    assert.ok(exportReady.latestEbook!.exportFormats.length >= 1);
  });

  test("8 produces Ebook Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.createProductOutline(fullInput);
    engine.createChapterStructure(fullInput);
    engine.generateCompleteWrittenContent(fullInput);
    engine.generateTablesChecklistsAndSummaries(fullInput);
    engine.generateReferencesAndAppendices(fullInput);
    engine.applyConsistentFormatting(fullInput);
    engine.performSelfReview(fullInput);
    engine.prepareExportReadyEbookAssets(fullInput);

    const report = engine.produceEbookReport(fullInput);
    const latest = report.latestEbook!;
    assert.ok(latest.ebookId.startsWith("ebw-ebk-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.productId.startsWith("ebw-prd-") || latest.productId.length > 0);
    assert.ok(latest.productTitle.length > 0);
    assert.ok(EBW_PRODUCT_TYPES.includes(latest.productType as (typeof EBW_PRODUCT_TYPES)[number]));
    assert.ok(latest.targetAudience.length > 0);
    assert.ok(Array.isArray(latest.chapterStructure));
    assert.ok(latest.chapterStructure.length >= 1);
    assert.ok(latest.wordCount > 0);
    assert.ok(Array.isArray(latest.includedResources));
    assert.ok(latest.qualityReview.length > 0);
    assert.ok(Array.isArray(latest.exportFormats));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, EBW_METADATA_VERSION);
    assert.equal(latest.reportVersion, EBOOK_REPORT_VERSION);
    assert.equal(latest.neverPublishProductsDirectly, true);
    assert.equal(latest.neverBuildSalesPages, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects sales-page/payment/deliver/publish/override/Q5-04 boundaries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    for (const forbidden of [
      { buildSalesPages: true },
      { processPayments: true },
      { deliverProductsToCustomers: true },
      { publishProductsDirectly: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ504OrLater: true },
    ] as const) {
      const report = engine.produceEbookReport({
        ...fullInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestEbook, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createEbookWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-ebw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.createProductOutline(fullInput);
    engine.createChapterStructure(fullInput);
    engine.generateCompleteWrittenContent(fullInput);
    engine.performSelfReview(fullInput);
    engine.prepareExportReadyEbookAssets(fullInput);
    const produced = engine.produceEbookReport(fullInput);
    const listed = engine.list();
    assert.ok(listed.ebooks.length >= 1);
    const submitted = engine.submitReport({
      ebookId: produced.latestEbook!.ebookId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-03"]);
    assert.equal(submitted.latestEbook!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestEbook!.executiveReportId, "ert-worker-ebw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-03");
    assert.equal(cockpit.neverPublishProductsDirectly, true);
    assert.equal(cockpit.neverBuildSalesPages, true);
  });
});
