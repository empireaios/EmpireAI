import type { ProductListingWorkerConfiguration } from "./configuration.js";
import {
  PLW_METADATA_VERSION,
  PRODUCT_LISTING_REPORT_VERSION,
  PRODUCT_LISTING_WORKER_IDENTITY,
} from "./paths.js";
import type {
  ApprovedImageRef,
  ApprovedProductInput,
  EvidenceItem,
  IntegrationHandshake,
  ListingAttribute,
  ListingPackage,
  ListingValidationStatus,
  ListingVariant,
  MarketplaceTarget,
  ProductListingReport,
  ProductListingWorkerCatalog,
  ProductListingWorkerInput,
  SeoFields,
} from "./types.js";

/** Pure Product Listing Worker helpers for Q3-08 — preparation only. */
export class ListingBuilder {
  buildCatalog(
    config: ProductListingWorkerConfiguration,
    listings: ProductListingReport[],
    integrations: IntegrationHandshake[],
  ): ProductListingWorkerCatalog {
    return {
      reportVersion: PRODUCT_LISTING_REPORT_VERSION,
      workerId: config.workerId,
      listings: listings.map(cloneListing),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: PLW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPublishListings: true,
      neverModifySupplierInformation: true,
      neverModifyPricing: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  resolveProduct(input: ProductListingWorkerInput): ApprovedProductInput {
    const base = input.approvedProduct ?? {};
    return {
      productId: input.productId ?? base.productId,
      productName: input.productName ?? base.productName,
      category: input.category ?? base.category,
      brand: input.brand ?? base.brand,
      keyFeatures: input.keyFeatures ?? base.keyFeatures,
      materials: input.materials ?? base.materials,
      dimensions: input.dimensions ?? base.dimensions,
      colorOptions: input.colorOptions ?? base.colorOptions,
      sizeOptions: input.sizeOptions ?? base.sizeOptions,
      targetKeywords: input.targetKeywords ?? base.targetKeywords,
      searchTerms: input.searchTerms ?? base.searchTerms,
      supplierId: input.supplierId ?? base.supplierId,
      supplierName: input.supplierName ?? base.supplierName,
      evaluationId: input.evaluationId ?? base.evaluationId,
      discoveryId: input.discoveryId ?? base.discoveryId,
      businessMissionId: input.businessMissionId ?? base.businessMissionId,
    };
  }

  resolveImages(input: ProductListingWorkerInput): ApprovedImageRef | null {
    if (input.approvedImages) return { ...input.approvedImages };
    if (input.imageReportId) return { imageReportId: input.imageReportId };
    return null;
  }

  resolveMarketplace(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
  ): MarketplaceTarget {
    const raw = String(input.marketplace ?? config.marketplaceTargets[0] ?? "generic")
      .trim()
      .toLowerCase();
    if (raw === "amazon" || raw === "shopify" || raw === "ebay" || raw === "generic") {
      return raw;
    }
    return "generic";
  }

  buildListing(
    input: ProductListingWorkerInput,
    config: ProductListingWorkerConfiguration,
    product: ApprovedProductInput,
    images: ApprovedImageRef | null,
  ): ProductListingReport {
    listingSequence += 1;
    const now = new Date().toISOString();
    const marketplace = this.resolveMarketplace(input, config);
    const productId =
      product.productId?.trim() || `prod-listing-${listingSequence}`;
    const productName =
      product.productName?.trim() || `Product ${listingSequence}`;
    const brand = product.brand?.trim() || "EmpireAI Essentials";
    const category = product.category?.trim() || "general";

    const productTitle = this.generateTitle(productName, brand, category, marketplace, config);
    const productDescription = this.generateDescription(product, brand, category);
    const bulletPoints = this.generateBullets(product, config);
    const attributes = this.generateAttributes(product, brand, category);
    const variants = this.generateVariants(product, productId, productName);
    const seoFields = this.generateSeo(product, productTitle, productDescription, marketplace);
    const listingValidationStatus = this.validateFields(
      productTitle,
      productDescription,
      bulletPoints,
      attributes,
      seoFields,
      images,
      marketplace,
      config,
    );
    const listingPackage = this.buildPackage(
      marketplace,
      productTitle,
      productDescription,
      bulletPoints,
      attributes,
      variants,
      seoFields,
      images,
      listingValidationStatus,
    );
    const evidence = this.compileEvidence(product, images, listingPackage, input, now);
    const confidenceScore = this.scoreConfidence(
      product,
      images,
      listingValidationStatus,
      evidence,
    );

    return {
      listingId: input.listingId?.trim() || `plw-lst-${Date.now()}-${listingSequence}`,
      timestamp: now,
      productId,
      productName,
      marketplace,
      productTitle,
      productDescription,
      bulletPoints,
      attributes,
      variants,
      seoFields,
      listingValidationStatus,
      listingPackage,
      supplierId: product.supplierId?.trim() || null,
      supplierName: product.supplierName?.trim() || null,
      imageReportId: images?.imageReportId?.trim() || input.imageReportId?.trim() || null,
      evaluationId: product.evaluationId?.trim() || null,
      discoveryId: product.discoveryId?.trim() || null,
      supportingEvidence: evidence,
      confidenceScore,
      businessMissionId: product.businessMissionId?.trim() || null,
      metadataVersion: PLW_METADATA_VERSION,
      reportVersion: PRODUCT_LISTING_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || PRODUCT_LISTING_WORKER_IDENTITY.workerId,
      neverPublishListings: true,
      neverModifySupplierInformation: true,
      neverModifyPricing: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ309OrLater: true,
      preserveProductTraceability: true,
      preserveSupplierReferences: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  generateTitle(
    productName: string,
    brand: string,
    category: string,
    marketplace: MarketplaceTarget,
    config: ProductListingWorkerConfiguration,
  ): string {
    const base =
      marketplace === "amazon"
        ? `${brand} ${productName} — Premium ${titleCase(category)} for Home & Office`
        : marketplace === "ebay"
          ? `${productName} by ${brand} | ${titleCase(category)}`
          : `${brand} ${productName}`;
    return base.slice(0, config.maxTitleLength).trim();
  }

  generateDescription(
    product: ApprovedProductInput,
    brand: string,
    category: string,
  ): string {
    const name = product.productName?.trim() || "this product";
    const features = (product.keyFeatures ?? []).filter(Boolean);
    const materials = (product.materials ?? []).filter(Boolean);
    const parts = [
      `Discover ${name} from ${brand}, designed for everyday ${category.replace(/_/g, " ")} use.`,
      features.length
        ? `Key strengths include ${features.slice(0, 4).join(", ")}.`
        : "Built for reliable daily performance with practical design details.",
      materials.length
        ? `Crafted with ${materials.join(", ")} for lasting quality.`
        : "Quality materials and careful finishing support long-term use.",
      product.dimensions?.trim()
        ? `Approximate dimensions: ${product.dimensions.trim()}.`
        : null,
      "This listing package is prepared for marketplace review and is not published automatically.",
    ].filter(Boolean);
    return parts.join(" ");
  }

  generateBullets(
    product: ApprovedProductInput,
    config: ProductListingWorkerConfiguration,
  ): string[] {
    const bullets: string[] = [];
    for (const feature of product.keyFeatures ?? []) {
      if (feature?.trim()) bullets.push(feature.trim());
    }
    if (product.materials?.length) {
      bullets.push(`Materials: ${product.materials.filter(Boolean).join(", ")}`);
    }
    if (product.dimensions?.trim()) {
      bullets.push(`Dimensions: ${product.dimensions.trim()}`);
    }
    if (product.colorOptions?.length) {
      bullets.push(`Available colors: ${product.colorOptions.filter(Boolean).join(", ")}`);
    }
    if (!bullets.length) {
      bullets.push(
        "Practical everyday design",
        "Quality construction",
        "Ready for marketplace listing review",
      );
    }
    return bullets.slice(0, config.maxBulletPoints);
  }

  generateAttributes(
    product: ApprovedProductInput,
    brand: string,
    category: string,
  ): ListingAttribute[] {
    const attrs: ListingAttribute[] = [
      { key: "brand", value: brand },
      { key: "category", value: category },
    ];
    if (product.dimensions?.trim()) {
      attrs.push({ key: "dimensions", value: product.dimensions.trim() });
    }
    if (product.materials?.length) {
      attrs.push({ key: "material", value: product.materials.filter(Boolean).join(", ") });
    }
    if (product.colorOptions?.length) {
      attrs.push({ key: "color", value: product.colorOptions.filter(Boolean).join(", ") });
    }
    if (product.sizeOptions?.length) {
      attrs.push({ key: "size", value: product.sizeOptions.filter(Boolean).join(", ") });
    }
    if (product.supplierId?.trim()) {
      attrs.push({ key: "supplier_reference", value: product.supplierId.trim() });
    }
    return attrs;
  }

  generateVariants(
    product: ApprovedProductInput,
    productId: string,
    productName: string,
  ): ListingVariant[] {
    const colors = (product.colorOptions ?? []).filter(Boolean);
    const sizes = (product.sizeOptions ?? []).filter(Boolean);
    if (!colors.length && !sizes.length) {
      return [
        {
          variantId: `var-${slug(productId)}-default`,
          sku: `${slug(productId).toUpperCase()}-STD`,
          title: productName,
          attributes: [{ key: "variant", value: "standard" }],
        },
      ];
    }
    const variants: ListingVariant[] = [];
    const colorList = colors.length ? colors : ["default"];
    const sizeList = sizes.length ? sizes : ["one_size"];
    let index = 0;
    for (const color of colorList) {
      for (const size of sizeList) {
        index += 1;
        variants.push({
          variantId: `var-${slug(productId)}-${index}`,
          sku: `${slug(productId).toUpperCase()}-${slug(color).toUpperCase()}-${slug(size).toUpperCase()}`.slice(
            0,
            40,
          ),
          title: `${productName} — ${titleCase(color)} / ${titleCase(size)}`,
          attributes: [
            { key: "color", value: color },
            { key: "size", value: size },
          ],
        });
      }
    }
    return variants.slice(0, 12);
  }

  generateSeo(
    product: ApprovedProductInput,
    title: string,
    description: string,
    marketplace: MarketplaceTarget,
  ): SeoFields {
    const keywords = unique([
      ...(product.targetKeywords ?? []).map((k) => k.trim()).filter(Boolean),
      ...(product.searchTerms ?? []).map((k) => k.trim()).filter(Boolean),
      product.productName?.trim() || "",
      product.category?.trim() || "",
      product.brand?.trim() || "",
    ]).filter(Boolean);
    const metaTitle =
      marketplace === "amazon"
        ? title.slice(0, 150)
        : `${title} | Shop ${product.brand?.trim() || "Now"}`.slice(0, 70);
    const metaDescription = description.slice(0, 160);
    return {
      metaTitle,
      metaDescription,
      searchTerms: keywords.slice(0, 8),
      backendKeywords: keywords.slice(0, 5),
    };
  }

  validateFields(
    title: string,
    description: string,
    bullets: string[],
    attributes: ListingAttribute[],
    seo: SeoFields,
    images: ApprovedImageRef | null,
    marketplace: MarketplaceTarget,
    config: ProductListingWorkerConfiguration,
  ): ListingValidationStatus {
    if (!title.trim() || !description.trim() || bullets.length === 0) return "fail";
    if (!attributes.some((a) => a.key === "brand")) return "fail";
    if (!seo.metaTitle.trim() || !seo.metaDescription.trim()) return "fail";
    if (title.length > config.maxTitleLength) return "fail";
    const needsImages = marketplace === "amazon" || marketplace === "shopify";
    const hasImages =
      Boolean(images?.primaryImageUri) ||
      Boolean(images?.packageId) ||
      Boolean(images?.imageReportId);
    if (needsImages && !hasImages) return "review";
    if (images?.complianceStatus === "non_compliant") return "fail";
    if (images?.imageQualityStatus === "fail") return "fail";
    if (images?.complianceStatus === "review_required" || images?.imageQualityStatus === "review") {
      return "review";
    }
    if (bullets.length < 3 || seo.searchTerms.length < 2) return "review";
    return "pass";
  }

  buildPackage(
    marketplace: MarketplaceTarget,
    title: string,
    description: string,
    bullets: string[],
    attributes: ListingAttribute[],
    variants: ListingVariant[],
    seo: SeoFields,
    images: ApprovedImageRef | null,
    status: ListingValidationStatus,
  ): ListingPackage {
    const imageRefs = unique(
      [
        images?.primaryImageUri ?? "",
        ...(images?.galleryImageUris ?? []),
        images?.packageId ?? "",
        images?.imageReportId ?? "",
      ].filter(Boolean),
    );
    return {
      packageId: `plw-pkg-${Date.now()}-${listingSequence}`,
      marketplace,
      fields: {
        title,
        description,
        bullet_points: bullets,
        attributes,
        variants,
        meta_title: seo.metaTitle,
        meta_description: seo.metaDescription,
        search_terms: seo.searchTerms,
        backend_keywords: seo.backendKeywords,
      },
      imageRefs,
      readyForReview: status === "pass" || status === "review",
      neverAutoPublished: true,
    };
  }

  compileEvidence(
    product: ApprovedProductInput,
    images: ApprovedImageRef | null,
    listingPackage: ListingPackage,
    input: ProductListingWorkerInput,
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
      "approved_product",
      `Listing prepared for ${product.productName ?? product.productId ?? "unknown product"}`,
      "fact",
      "product",
    );
    if (product.supplierId) {
      add(
        "supplier_reference",
        `Supplier reference preserved: ${product.supplierId}`,
        "fact",
        "traceability",
      );
    }
    if (product.evaluationId || product.discoveryId) {
      add(
        "product_traceability",
        `Traceable via evaluation=${product.evaluationId ?? "n/a"} discovery=${product.discoveryId ?? "n/a"}`,
        "fact",
        "traceability",
      );
    }
    if (images?.imageReportId) {
      add(
        "product_image_worker",
        `Linked to Product Image Report ${images.imageReportId}`,
        "fact",
        "images",
      );
    }
    add(
      "listing_package",
      `Marketplace package ${listingPackage.packageId} prepared for ${listingPackage.marketplace} (not published)`,
      "assumption",
      "package",
    );
    add(
      "boundary",
      "Preparation-only: does not publish listings, modify supplier information, or modify pricing",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    product: ApprovedProductInput,
    images: ApprovedImageRef | null,
    status: ListingValidationStatus,
    evidence: EvidenceItem[],
  ): number {
    let score = 0.35;
    if (product.productName?.trim()) score += 0.1;
    if ((product.keyFeatures ?? []).length >= 2) score += 0.1;
    if (product.supplierId) score += 0.05;
    if (images?.imageReportId || images?.primaryImageUri) score += 0.1;
    score += Math.min(0.15, evidence.filter((e) => e.kind === "fact").length * 0.03);
    if (status === "pass") score += 0.15;
    if (status === "review") score += 0.05;
    if (status === "fail") score -= 0.2;
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let listingSequence = 0;

export function resetListingSequenceForTesting() {
  listingSequence = 0;
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneListing(listing: ProductListingReport): ProductListingReport {
  return {
    ...listing,
    bulletPoints: [...listing.bulletPoints],
    attributes: listing.attributes.map((a) => ({ ...a })),
    variants: listing.variants.map((v) => ({
      ...v,
      attributes: v.attributes.map((a) => ({ ...a })),
    })),
    seoFields: {
      ...listing.seoFields,
      searchTerms: [...listing.seoFields.searchTerms],
      backendKeywords: [...listing.seoFields.backendKeywords],
    },
    listingPackage: {
      ...listing.listingPackage,
      fields: { ...listing.listingPackage.fields },
      imageRefs: [...listing.listingPackage.imageRefs],
      neverAutoPublished: true,
    },
    supportingEvidence: listing.supportingEvidence.map((e) => ({ ...e })),
  };
}
