import type { ProductImageWorkerConfiguration } from "./configuration.js";
import {
  PIW_METADATA_VERSION,
  PRODUCT_IMAGE_REPORT_VERSION,
  PRODUCT_IMAGE_WORKER_IDENTITY,
} from "./paths.js";
import type {
  ComplianceStatus,
  EvidenceItem,
  ImageMetadataRecord,
  ImageQualityStatus,
  ImageVariantRecord,
  IntegrationHandshake,
  MarketplaceTarget,
  ProcessedImageRecord,
  ProductImageReport,
  ProductImageWorkerCatalog,
  ProductImageWorkerInput,
  SourceImageInput,
} from "./types.js";

/** Pure Product Image Worker helpers for Q3-07 — preparation only. */
export class ImageBuilder {
  buildCatalog(
    config: ProductImageWorkerConfiguration,
    imageReports: ProductImageReport[],
    integrations: IntegrationHandshake[],
  ): ProductImageWorkerCatalog {
    return {
      reportVersion: PRODUCT_IMAGE_REPORT_VERSION,
      workerId: config.workerId,
      imageReports: imageReports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: PIW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPublishListings: true,
      neverGenerateAdvertisements: true,
      neverContactSuppliers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverOverwriteOriginalSourceAssets: true,
    };
  }

  resolveSourceImages(input: ProductImageWorkerInput): SourceImageInput[] {
    return (input.sourceImages ?? [])
      .map((image, index) => normalizeSource(image, index + 1))
      .filter((image) => image.sourceUri || image.fileName || image.imageId);
  }

  buildReport(
    input: ProductImageWorkerInput,
    config: ProductImageWorkerConfiguration,
    sourceImages: SourceImageInput[],
  ): ProductImageReport {
    reportSequence += 1;
    const now = new Date().toISOString();
    const productId =
      input.productId?.trim() || `prod-image-${reportSequence}`;
    const productName =
      input.productName?.trim() || `product-${reportSequence}`;
    const supplierId =
      input.supplierId?.trim() || `sup-image-${reportSequence}`;
    const supplierName =
      input.supplierName?.trim() || `supplier-${reportSequence}`;
    const marketplaces = this.resolveMarketplaces(input, config);

    const { duplicates, unusable } = this.detectIssues(sourceImages, config);
    const usable = sourceImages.filter(
      (s) =>
        !duplicates.includes(s.imageId!) &&
        !unusable.includes(s.imageId!),
    );
    const processed = this.processImages(usable, duplicates, unusable, productId);
    const variants = this.generateVariants(usable, marketplaces, productId);
    const preservedMetadata = this.preserveMetadata(sourceImages, now);
    const imageQualityStatus = this.scoreQuality(sourceImages, usable, unusable);
    const complianceStatus = this.scoreCompliance(
      usable,
      variants,
      marketplaces,
      config,
      imageQualityStatus,
    );
    const packageId = `piw-pkg-${Date.now()}-${reportSequence}`;
    const processingSummary = this.buildSummary(
      sourceImages,
      processed,
      variants,
      duplicates,
      unusable,
      imageQualityStatus,
      complianceStatus,
    );
    const evidence = this.compileEvidence(
      sourceImages,
      processed,
      variants,
      duplicates,
      unusable,
      input,
      now,
    );
    const confidenceScore = this.scoreConfidence(
      sourceImages,
      usable,
      evidence,
      imageQualityStatus,
      complianceStatus,
    );

    return {
      imageReportId:
        input.imageReportId?.trim() || `piw-img-${Date.now()}-${reportSequence}`,
      timestamp: now,
      productId,
      productName,
      supplierId,
      supplierName,
      evaluationId: input.evaluationId?.trim() || null,
      discoveryId: input.discoveryId?.trim() || null,
      sourceImages: sourceImages.map((s) => ({ ...s })),
      processedImages: processed,
      imageQualityStatus,
      complianceStatus,
      imageVariants: variants,
      processingSummary,
      marketplaceTargets: marketplaces,
      duplicateImageIds: duplicates,
      unusableImageIds: unusable,
      preservedMetadata,
      packageId,
      supportingEvidence: evidence,
      confidenceScore,
      businessMissionId: input.businessMissionId?.trim() || null,
      metadataVersion: PIW_METADATA_VERSION,
      reportVersion: PRODUCT_IMAGE_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || PRODUCT_IMAGE_WORKER_IDENTITY.workerId,
      neverPublishListings: true,
      neverGenerateAdvertisements: true,
      neverContactSuppliers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ308OrLater: true,
      neverOverwriteOriginalSourceAssets: true,
      preserveOriginalSupplierAssets: true,
      maintainSupplierTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  resolveMarketplaces(
    input: ProductImageWorkerInput,
    config: ProductImageWorkerConfiguration,
  ): MarketplaceTarget[] {
    const fromInput = (input.marketplaceTargets ?? [])
      .map((m) => String(m).trim().toLowerCase())
      .filter(Boolean);
    const targets = fromInput.length
      ? fromInput
      : config.marketplaceTargets.map((m) => m.toLowerCase());
    const allowed = new Set(["amazon", "shopify", "ebay", "generic"]);
    const resolved = targets.filter((t): t is MarketplaceTarget => allowed.has(t));
    return resolved.length ? unique(resolved) : ["generic"];
  }

  detectIssues(
    sourceImages: SourceImageInput[],
    config: ProductImageWorkerConfiguration,
  ): { duplicates: string[]; unusable: string[] } {
    const duplicates: string[] = [];
    const unusable: string[] = [];
    const seenHashes = new Map<string, string>();

    for (const image of sourceImages) {
      const id = image.imageId!;
      const hash = image.contentHash?.trim();
      if (hash) {
        const prior = seenHashes.get(hash);
        if (prior) duplicates.push(id);
        else seenHashes.set(hash, id);
      }
      const width = image.widthPx ?? 0;
      const height = image.heightPx ?? 0;
      const format = image.format?.toLowerCase() ?? "";
      if (
        width < config.minWidthPx ||
        height < config.minHeightPx ||
        image.hasWatermark === true ||
        !["jpg", "jpeg", "png", "webp"].includes(format)
      ) {
        unusable.push(id);
      }
    }
    return {
      duplicates: unique(duplicates),
      unusable: unique(unusable.filter((id) => !duplicates.includes(id))),
    };
  }

  processImages(
    usable: SourceImageInput[],
    duplicates: string[],
    unusable: string[],
    productId: string,
  ): ProcessedImageRecord[] {
    const processed: ProcessedImageRecord[] = [];
    usable.forEach((image, index) => {
      processed.push({
        processedImageId: `proc-${image.imageId}`,
        sourceImageId: image.imageId!,
        derivedUri: `derived://product-image/${productId}/${image.imageId}/optimized`,
        widthPx: image.widthPx ?? 1000,
        heightPx: image.heightPx ?? 1000,
        format: (image.format ?? "jpg").toLowerCase(),
        role: image.isPrimary || index === 0 ? "primary" : "gallery",
        qualityNotes: [
          "Derived copy created; original supplier asset preserved unchanged",
          `Dimensions ${image.widthPx ?? "unknown"}x${image.heightPx ?? "unknown"}`,
        ],
        originalPreserved: true,
      });
    });
    for (const id of [...duplicates, ...unusable]) {
      processed.push({
        processedImageId: `proc-${id}`,
        sourceImageId: id,
        derivedUri: `derived://product-image/${productId}/${id}/rejected`,
        widthPx: 0,
        heightPx: 0,
        format: "n/a",
        role: "rejected",
        qualityNotes: [
          duplicates.includes(id) ? "Duplicate of another source image" : "Unusable for marketplace",
          "Original supplier asset preserved unchanged",
        ],
        originalPreserved: true,
      });
    }
    return processed;
  }

  generateVariants(
    usable: SourceImageInput[],
    marketplaces: MarketplaceTarget[],
    productId: string,
  ): ImageVariantRecord[] {
    const variants: ImageVariantRecord[] = [];
    const primary = usable.find((i) => i.isPrimary) ?? usable[0];
    if (!primary) return variants;
    for (const marketplace of marketplaces) {
      const size = marketplace === "amazon" ? 1600 : marketplace === "ebay" ? 1500 : 1200;
      variants.push({
        variantId: `var-${primary.imageId}-${marketplace}`,
        sourceImageId: primary.imageId!,
        marketplace,
        widthPx: size,
        heightPx: size,
        format: "jpg",
        purpose: `${marketplace}_main`,
        derivedUri: `derived://product-image/${productId}/${primary.imageId}/${marketplace}-${size}`,
      });
      if (marketplace === "amazon" || marketplace === "shopify") {
        variants.push({
          variantId: `var-${primary.imageId}-${marketplace}-thumb`,
          sourceImageId: primary.imageId!,
          marketplace,
          widthPx: 500,
          heightPx: 500,
          format: "jpg",
          purpose: `${marketplace}_thumbnail`,
          derivedUri: `derived://product-image/${productId}/${primary.imageId}/${marketplace}-thumb`,
        });
      }
    }
    return variants;
  }

  preserveMetadata(
    sourceImages: SourceImageInput[],
    now: string,
  ): ImageMetadataRecord[] {
    return sourceImages.map((image) => ({
      sourceImageId: image.imageId!,
      widthPx: image.widthPx ?? null,
      heightPx: image.heightPx ?? null,
      format: image.format ?? null,
      contentHash: image.contentHash ?? null,
      supplierAssetId: image.supplierAssetId ?? null,
      preservedAt: now,
    }));
  }

  scoreQuality(
    sourceImages: SourceImageInput[],
    usable: SourceImageInput[],
    unusable: string[],
  ): ImageQualityStatus {
    if (!sourceImages.length) return "fail";
    if (!usable.length) return "fail";
    if (unusable.length || usable.length < sourceImages.length) return "review";
    const allLarge = usable.every(
      (i) => (i.widthPx ?? 0) >= 1200 && (i.heightPx ?? 0) >= 1200,
    );
    return allLarge ? "pass" : "review";
  }

  scoreCompliance(
    usable: SourceImageInput[],
    variants: ImageVariantRecord[],
    marketplaces: MarketplaceTarget[],
    config: ProductImageWorkerConfiguration,
    quality: ImageQualityStatus,
  ): ComplianceStatus {
    if (!usable.length || quality === "fail") return "non_compliant";
    const hasVariantsForAll = marketplaces.every((m) =>
      variants.some((v) => v.marketplace === m),
    );
    const meetsMin = usable.every(
      (i) =>
        (i.widthPx ?? 0) >= config.minWidthPx &&
        (i.heightPx ?? 0) >= config.minHeightPx &&
        i.hasWatermark !== true &&
        i.hasTextOverlay !== true,
    );
    if (meetsMin && hasVariantsForAll && quality === "pass") return "compliant";
    if (meetsMin && hasVariantsForAll) return "review_required";
    return "non_compliant";
  }

  buildSummary(
    sourceImages: SourceImageInput[],
    processed: ProcessedImageRecord[],
    variants: ImageVariantRecord[],
    duplicates: string[],
    unusable: string[],
    quality: ImageQualityStatus,
    compliance: ComplianceStatus,
  ): string {
    return [
      `Received ${sourceImages.length} supplier image(s)`,
      `processed ${processed.filter((p) => p.role !== "rejected").length} usable asset(s)`,
      `generated ${variants.length} marketplace variant(s)`,
      `duplicates=${duplicates.length}`,
      `unusable=${unusable.length}`,
      `quality=${quality}`,
      `compliance=${compliance}`,
      "originals preserved (no overwrite)",
    ].join("; ");
  }

  compileEvidence(
    sourceImages: SourceImageInput[],
    processed: ProcessedImageRecord[],
    variants: ImageVariantRecord[],
    duplicates: string[],
    unusable: string[],
    input: ProductImageWorkerInput,
    now: string,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    const add = (
      source: string,
      claim: string,
      kind: EvidenceItem["kind"],
      relatedTopic: string,
    ) => {
      seq += 1;
      items.push({
        evidenceId: `ev-${seq}`,
        source,
        claim,
        kind,
        relatedTopic,
        recordedAt: now,
      });
    };

    for (const raw of input.evidenceSources ?? []) {
      const claim = raw.claim?.trim();
      if (!claim) continue;
      add(
        raw.source?.trim() || "provided_source",
        claim,
        raw.kind === "fact" ? "fact" : "assumption",
        raw.relatedTopic?.trim() || "general",
      );
    }
    add(
      "supplier_assets",
      `Received ${sourceImages.length} approved supplier image(s) for ${input.productId ?? "unknown product"}`,
      "fact",
      "intake",
    );
    if (input.supplierId) {
      add(
        "supplier_traceability",
        `Traceable to supplier ${input.supplierId}` +
          (input.evaluationId ? ` / evaluation ${input.evaluationId}` : ""),
        "fact",
        "traceability",
      );
    }
    if (duplicates.length) {
      add("duplicate_detection", `Duplicate image ids: ${duplicates.join(", ")}`, "fact", "quality");
    }
    if (unusable.length) {
      add("quality_gate", `Unusable image ids: ${unusable.join(", ")}`, "fact", "quality");
    }
    add(
      "processing",
      `Prepared ${processed.filter((p) => p.role !== "rejected").length} processed image(s) and ${variants.length} variant(s)`,
      "assumption",
      "processing",
    );
    add(
      "boundary",
      "Preparation-only: does not publish listings, generate advertisements, contact suppliers, or overwrite originals",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    sourceImages: SourceImageInput[],
    usable: SourceImageInput[],
    evidence: EvidenceItem[],
    quality: ImageQualityStatus,
    compliance: ComplianceStatus,
  ): number {
    let score = 0.35;
    score += Math.min(0.25, sourceImages.length * 0.05);
    score += Math.min(0.2, usable.length * 0.05);
    score += Math.min(0.15, evidence.filter((e) => e.kind === "fact").length * 0.03);
    if (quality === "pass") score += 0.1;
    if (compliance === "compliant") score += 0.1;
    if (quality === "fail" || compliance === "non_compliant") score -= 0.2;
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let reportSequence = 0;

export function resetImageSequenceForTesting() {
  reportSequence = 0;
}

function normalizeSource(image: SourceImageInput, index: number): SourceImageInput {
  return {
    imageId: image.imageId?.trim() || `src-img-${index}`,
    sourceUri: image.sourceUri?.trim() || null,
    fileName: image.fileName?.trim() || null,
    widthPx: image.widthPx ?? null,
    heightPx: image.heightPx ?? null,
    format: image.format?.trim().toLowerCase() || null,
    contentHash: image.contentHash?.trim() || null,
    hasWatermark: image.hasWatermark ?? null,
    hasTextOverlay: image.hasTextOverlay ?? null,
    isPrimary: image.isPrimary ?? null,
    supplierAssetId: image.supplierAssetId?.trim() || null,
  };
}

function unique<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function cloneReport(report: ProductImageReport): ProductImageReport {
  return {
    ...report,
    sourceImages: report.sourceImages.map((s) => ({ ...s })),
    processedImages: report.processedImages.map((p) => ({
      ...p,
      qualityNotes: [...p.qualityNotes],
      originalPreserved: true,
    })),
    imageVariants: report.imageVariants.map((v) => ({ ...v })),
    marketplaceTargets: [...report.marketplaceTargets],
    duplicateImageIds: [...report.duplicateImageIds],
    unusableImageIds: [...report.unusableImageIds],
    preservedMetadata: report.preservedMetadata.map((m) => ({ ...m })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
