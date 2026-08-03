import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  COMPLIANCE_STATUSES,
  IMAGE_QUALITY_STATUSES,
  PIW_CAPABILITIES,
  PIW_INTEGRATION_TARGETS,
  PIW_METADATA_VERSION,
  PRODUCT_IMAGE_REPORT_VERSION,
  buildProductImageWorkerConfiguration,
  createProductImageWorker,
  resetProductImageWorkerForTesting,
} from "../../product-image-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createProductImageWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createProductImageWorker(bootstrap, config);
  await engine.initialize();
  engine.connectProductImageWorker();
  return engine;
}

const sampleImages = [
  {
    imageId: "src-img-primary",
    sourceUri: "supplier://assets/bamboo-primary.jpg",
    fileName: "bamboo-primary.jpg",
    widthPx: 1600,
    heightPx: 1600,
    format: "jpg",
    contentHash: "hash-primary-001",
    hasWatermark: false,
    hasTextOverlay: false,
    isPrimary: true,
    supplierAssetId: "sup-asset-primary",
  },
  {
    imageId: "src-img-gallery-1",
    sourceUri: "supplier://assets/bamboo-side.jpg",
    fileName: "bamboo-side.jpg",
    widthPx: 1400,
    heightPx: 1400,
    format: "jpg",
    contentHash: "hash-gallery-001",
    hasWatermark: false,
    hasTextOverlay: false,
    isPrimary: false,
    supplierAssetId: "sup-asset-side",
  },
];

const sampleInput = {
  productId: "prod-bamboo-desk-organizer",
  productName: "Bamboo Desk Organizer",
  supplierId: "sup-shenzhen-bamboo-co",
  supplierName: "Shenzhen Bamboo Co",
  evaluationId: "sew-eval-bamboo-01",
  discoveryId: "sdw-discovery-bamboo-01",
  businessMissionId: "cmf-cbm-commerce-01",
  sourceImages: sampleImages,
  marketplaceTargets: ["amazon", "shopify"],
  evidenceSources: [
    {
      source: "supplier_evaluation_worker",
      claim: "Images linked to approved supplier evaluation sew-eval-bamboo-01",
      kind: "fact",
      relatedTopic: "traceability",
    },
  ],
  validated: true,
};

describe("Q3-07 Product Image Worker", () => {
  beforeEach(resetProductImageWorkerForTesting);

  test("1 locks mandatory product-image-worker boundaries", () => {
    const c = buildProductImageWorkerConfiguration(REPO_ROOT, {
      neverPublishListings: false as never,
      neverGenerateAdvertisements: false as never,
      neverContactSuppliers: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ308OrLater: false as never,
      neverOverwriteOriginalSourceAssets: false as never,
    });
    assert.equal(c.neverPublishListings, true);
    assert.equal(c.neverGenerateAdvertisements, true);
    assert.equal(c.neverContactSuppliers, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ308OrLater, true);
    assert.equal(c.neverOverwriteOriginalSourceAssets, true);
  });

  test("2 initializes PILLOW-PIW-001 for Q3-07 with evaluation + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-07");
    assert.equal(state.engineVersion, "PILLOW-PIW-001");
    assert.equal(state.configuration.workerId, "wkr-product-image-01");
    for (const target of PIW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const status of IMAGE_QUALITY_STATUSES) {
      assert.ok(typeof status === "string");
    }
    for (const status of COMPLIANCE_STATUSES) {
      assert.ok(typeof status === "string");
    }
    assert.ok(PIW_CAPABILITIES.includes("validate_image_quality"));
  });

  test("3 receives approved supplier images and validates quality", async () => {
    const engine = await build();
    const received = engine.receiveApprovedSupplierImages(sampleInput);
    assert.equal(received.action, "receive_approved_images");
    const quality = engine.validateImageQuality(sampleInput);
    assert.ok(quality.latestImageReport!.sourceImages.length >= 2);
    assert.ok(["pass", "review", "fail"].includes(quality.latestImageReport!.imageQualityStatus));
    assert.ok(["pass", "partial"].includes(quality.validation.decision));
  });

  test("4 detects duplicates/unusable and organizes image sets", async () => {
    const engine = await build();
    const withDup = {
      ...sampleInput,
      sourceImages: [
        ...sampleImages,
        {
          ...sampleImages[0],
          imageId: "src-img-dup",
          fileName: "bamboo-primary-copy.jpg",
          contentHash: "hash-primary-001",
          isPrimary: false,
        },
      ],
    };
    const duplicates = engine.detectDuplicateOrUnusableImages(withDup);
    const organized = engine.organizeProductImageSets(withDup);
    assert.ok(duplicates.latestImageReport!.duplicateImageIds.includes("src-img-dup"));
    assert.ok(organized.latestImageReport!.processedImages.some((p) => p.role === "primary"));
  });

  test("5 prepares compliant images, variants, and preserves metadata", async () => {
    const engine = await build();
    const prepared = engine.prepareMarketplaceCompliantImages(sampleInput);
    const variants = engine.generateStandardizedImageVariants(sampleInput);
    const metadata = engine.preserveImageMetadata(sampleInput);
    assert.ok(prepared.latestImageReport!.processedImages.length >= 1);
    assert.ok(variants.latestImageReport!.imageVariants.length >= 1);
    assert.ok(metadata.latestImageReport!.preservedMetadata.length >= 2);
    assert.ok(
      prepared.latestImageReport!.processedImages.every((p) => p.originalPreserved === true),
    );
  });

  test("6 validates marketplace compliance and packages visual assets", async () => {
    const engine = await build();
    const compliance = engine.validateMarketplaceCompliance(sampleInput);
    const packaged = engine.packageProductVisualAssets(sampleInput);
    assert.ok(
      ["compliant", "review_required", "non_compliant"].includes(
        compliance.latestImageReport!.complianceStatus,
      ),
    );
    assert.equal(compliance.latestImageReport!.complianceStatus, "compliant");
    assert.ok(packaged.latestImageReport!.packageId.startsWith("piw-pkg-"));
  });

  test("7 produces machine-readable Product Image Report with required fields", async () => {
    const report = (await build()).produceProductImageReport(sampleInput);
    const latest = report.latestImageReport!;
    assert.ok(latest.imageReportId.startsWith("piw-img-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.equal(latest.supplierId, "sup-shenzhen-bamboo-co");
    assert.ok(latest.sourceImages.length >= 2);
    assert.ok(latest.processedImages.length >= 1);
    assert.ok(latest.imageQualityStatus);
    assert.ok(latest.complianceStatus);
    assert.ok(latest.imageVariants.length >= 1);
    assert.ok(latest.processingSummary);
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.ok(latest.preservedMetadata.length >= 1);
    assert.equal(latest.metadataVersion, PIW_METADATA_VERSION);
    assert.equal(latest.reportVersion, PRODUCT_IMAGE_REPORT_VERSION);
    assert.equal(latest.neverOverwriteOriginalSourceAssets, true);
  });

  test("8 marks poor/watermarked images as fail / non_compliant", async () => {
    const report = (await build()).produceProductImageReport({
      productId: "prod-weak",
      supplierId: "sup-weak",
      sourceImages: [
        {
          imageId: "src-bad",
          sourceUri: "supplier://assets/tiny-watermarked.jpg",
          widthPx: 200,
          heightPx: 200,
          format: "gif",
          hasWatermark: true,
          contentHash: "hash-bad",
        },
      ],
      validated: true,
    });
    assert.equal(report.latestImageReport!.imageQualityStatus, "fail");
    assert.equal(report.latestImageReport!.complianceStatus, "non_compliant");
  });

  test("9 rejects publish / ads / contact / override / overwrite / Q3-08 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { publishListings: true },
      { generateAdvertisements: true },
      { contactSuppliers: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ308OrLater: true },
      { overwriteOriginalSourceAssets: true },
    ] as const) {
      const report = engine.produceProductImageReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestImageReport, null);
    }
  });

  test("10 submits findings through ERR and preserves audit / cockpit boundaries", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createProductImageWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-piw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectProductImageWorker();
    const produced = engine.produceProductImageReport(sampleInput);
    const submitted = engine.submitFindings({
      imageReportId: produced.latestImageReport!.imageReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-07"]);
    assert.equal(submitted.latestImageReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestImageReport!.executiveReportId, "ert-worker-piw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-07");
    assert.equal(cockpit.neverPublishListings, true);
    assert.equal(cockpit.neverOverwriteOriginalSourceAssets, true);
  });
});
