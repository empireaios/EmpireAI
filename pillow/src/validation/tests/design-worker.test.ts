import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  DW_ASSET_TYPES,
  DW_CAPABILITIES,
  DW_INTEGRATION_TARGETS,
  DW_METADATA_VERSION,
  DESIGN_WORKER_REPORT_VERSION,
  buildDesignWorkerConfiguration,
  createDesignWorker,
  resetDesignWorkerForTesting,
} from "../../design-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createDesignWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createDesignWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const productInput = {
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-design-01",
  factoryMissionId: "dpf-dpm-design-01",
  productTitle: "Freelancer Client Onboarding Toolkit",
  productType: "branding_assets" as const,
  targetAudience: "Solo freelancers and consultants",
  brandingTheme: "Clean Professional Teal",
  validated: true,
};

const fullInput = {
  ...productInput,
  validated: true,
};

describe("Q5-07 Design Worker", () => {
  beforeEach(resetDesignWorkerForTesting);

  test("1 locks mandatory design-worker boundaries", () => {
    const c = buildDesignWorkerConfiguration(REPO_ROOT, {
      neverBuildSalesPages: false as never,
      neverProcessPayments: false as never,
      neverDeliverProducts: false as never,
      neverPublishAssetsDirectly: false as never,
      neverPublishProductsDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ508OrLater: false as never,
      followApprovedProductIntent: false as never,
    });
    assert.equal(c.neverBuildSalesPages, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverDeliverProducts, true);
    assert.equal(c.neverPublishAssetsDirectly, true);
    assert.equal(c.neverPublishProductsDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ508OrLater, true);
    assert.equal(c.followApprovedProductIntent, true);
  });

  test("2 initializes PILLOW-DW-001 for Q5-07 with DPF integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-07");
    assert.equal(state.engineVersion, "PILLOW-DW-001");
    assert.equal(state.configuration.workerId, "wkr-design-01");
    for (const target of DW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    for (const type of DW_ASSET_TYPES) {
      assert.ok(state.configuration.supportedAssetTypes.includes(type));
    }
    assert.ok(DW_CAPABILITIES.includes("receive_approved_digital_product_information"));
    assert.ok(DW_CAPABILITIES.includes("produce_machine_readable_design_worker_reports"));
  });

  test("3 receives approved digital product information", async () => {
    const report = (await build()).receiveApprovedDigitalProductInformation(productInput);
    assert.equal(report.action, "receive_approved_digital_product_information");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestDesignReport!.researchReportId, "dpr-rsh-001");
    assert.equal(report.latestDesignReport!.opportunityId, "dpr-opp-001");
    assert.ok(report.latestDesignReport!.designReportId.startsWith("dw-dsr-"));
  });

  test("4 generates ebook covers and course covers", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    const ebookCovers = engine.generateEbookCovers(fullInput);
    assert.equal(ebookCovers.action, "generate_ebook_covers");
    assert.ok(ebookCovers.latestDesignReport!.ebookCovers.length >= 1);

    const courseCovers = engine.generateCourseCovers(fullInput);
    assert.equal(courseCovers.action, "generate_course_covers");
    assert.ok(courseCovers.latestDesignReport!.courseCovers.length >= 1);
  });

  test("5 generates branding, promos, and multiple asset types", async () => {
    assert.ok(DW_ASSET_TYPES.includes("ebook_cover"));
    assert.ok(DW_ASSET_TYPES.includes("branding_assets"));
    assert.ok(DW_ASSET_TYPES.includes("mockups"));

    const engine = await build();
    engine.receiveApprovedDigitalProductInformation({
      ...productInput,
      productType: "branding_assets",
    });
    engine.generateEbookCovers({ ...fullInput, productType: "branding_assets" });
    engine.generateCourseCovers({ ...fullInput, productType: "branding_assets" });
    const branding = engine.generateProductBrandingAssets({
      ...fullInput,
      productType: "branding_assets",
    });
    assert.equal(branding.action, "generate_product_branding_assets");
    assert.ok(branding.latestDesignReport!.brandingAssets.length >= 1);
    assert.ok(branding.latestDesignReport!.brandingTheme.length > 0);

    const promos = engine.generatePromotionalGraphics({
      ...fullInput,
      productType: "branding_assets",
    });
    assert.equal(promos.action, "generate_promotional_graphics");
    assert.ok(promos.latestDesignReport!.promotionalGraphics.length >= 1);

    resetDesignWorkerForTesting();
    const mockupEngine = await build();
    const received = mockupEngine.receiveApprovedDigitalProductInformation({
      researchReportId: "dpr-rsh-mockup-01",
      opportunityId: "dpr-opp-mockup-01",
      businessId: "dbiz-mockup-01",
      factoryMissionId: "dpf-dpm-mockup-01",
      productTitle: "Course Mockup Pack",
      productType: "mockups",
      targetAudience: "Course creators",
      validated: true,
    });
    assert.equal(received.latestDesignReport!.productType, "mockups");
    const mockups = mockupEngine.generateRealisticProductMockups({
      productType: "mockups",
      productTitle: "Course Mockup Pack",
      validated: true,
    });
    assert.equal(mockups.action, "generate_realistic_product_mockups");
    assert.ok(mockups.latestDesignReport!.mockupAssets.length >= 1);
  });

  test("6 generates preview images and maintains branding consistency", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateEbookCovers(fullInput);
    engine.generateCourseCovers(fullInput);
    engine.generateProductBrandingAssets(fullInput);
    engine.generatePromotionalGraphics(fullInput);
    engine.generateRealisticProductMockups(fullInput);

    const previews = engine.generatePreviewImages(fullInput);
    assert.equal(previews.action, "generate_preview_images");
    assert.ok(previews.latestDesignReport!.previewAssets.length >= 1);

    const consistency = engine.maintainVisualBrandingConsistency(fullInput);
    assert.equal(consistency.action, "maintain_visual_branding_consistency");
    assert.ok(typeof consistency.latestDesignReport!.brandingConsistencyValidated === "boolean");
  });

  test("7 prepares export-ready design assets after quality review path", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateEbookCovers(fullInput);
    engine.generateCourseCovers(fullInput);
    engine.generateProductBrandingAssets(fullInput);
    engine.generatePromotionalGraphics(fullInput);
    engine.generateRealisticProductMockups(fullInput);
    engine.generatePreviewImages(fullInput);
    engine.maintainVisualBrandingConsistency(fullInput);

    const exportReady = engine.prepareExportReadyDesignAssets(fullInput);
    assert.equal(exportReady.action, "prepare_export_ready_design_assets");
    assert.ok(exportReady.latestDesignReport!.exportFormats.length >= 1);
    assert.ok(exportReady.latestDesignReport!.qualityReview.length > 0);
    assert.ok(exportReady.latestDesignReport!.confidenceScore > 0);
  });

  test("8 produces Design Worker Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateEbookCovers(fullInput);
    engine.generateCourseCovers(fullInput);
    engine.generateProductBrandingAssets(fullInput);
    engine.generatePromotionalGraphics(fullInput);
    engine.generateRealisticProductMockups(fullInput);
    engine.generatePreviewImages(fullInput);
    engine.maintainVisualBrandingConsistency(fullInput);
    engine.prepareExportReadyDesignAssets(fullInput);

    const report = engine.produceDesignWorkerReport(fullInput);
    const latest = report.latestDesignReport!;
    assert.ok(latest.designReportId.startsWith("dw-dsr-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.productId.startsWith("dw-prd-") || latest.productId.length > 0);
    assert.ok(latest.productTitle.length > 0);
    assert.ok(Array.isArray(latest.assetTypesCreated));
    assert.ok(latest.assetTypesCreated.length >= 1);
    assert.ok(latest.brandingTheme.length > 0);
    assert.ok(Array.isArray(latest.previewAssets));
    assert.ok(latest.previewAssets.length >= 1);
    assert.ok(Array.isArray(latest.mockupAssets));
    assert.ok(latest.mockupAssets.length >= 1);
    assert.ok(Array.isArray(latest.exportFormats));
    assert.ok(latest.exportFormats.length >= 1);
    assert.ok(latest.qualityReview.length > 0);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, DW_METADATA_VERSION);
    assert.equal(latest.reportVersion, DESIGN_WORKER_REPORT_VERSION);
    assert.equal(latest.neverPublishAssetsDirectly, true);
    assert.equal(latest.neverBuildSalesPages, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects sales-page/payment/deliver/publish/override/Q5-08 boundaries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    for (const forbidden of [
      { buildSalesPages: true },
      { processPayments: true },
      { deliverProducts: true },
      { publishAssetsDirectly: true },
      { publishProductsDirectly: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ508OrLater: true },
    ] as const) {
      const report = engine.produceDesignWorkerReport({
        ...fullInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestDesignReport, null);
    }
  });

  test("10 lists + submits via ERR + cockpit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createDesignWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-dw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateEbookCovers(fullInput);
    engine.generateCourseCovers(fullInput);
    engine.generateProductBrandingAssets(fullInput);
    engine.generatePromotionalGraphics(fullInput);
    engine.generateRealisticProductMockups(fullInput);
    engine.generatePreviewImages(fullInput);
    engine.maintainVisualBrandingConsistency(fullInput);
    engine.prepareExportReadyDesignAssets(fullInput);
    const produced = engine.produceDesignWorkerReport(fullInput);
    const listed = engine.list();
    assert.ok(listed.designReports.length >= 1);
    const submitted = engine.submitReport({
      designReportId: produced.latestDesignReport!.designReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-07"]);
    assert.equal(submitted.latestDesignReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestDesignReport!.executiveReportId, "ert-worker-dw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-07");
    assert.equal(cockpit.neverPublishAssetsDirectly, true);
    assert.equal(cockpit.neverBuildSalesPages, true);
  });
});
