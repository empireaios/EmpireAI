import type { DesignWorkerConfiguration } from "./configuration.js";
import type { DprEnrichmentContext } from "./integrations.js";
import {
  DESIGN_WORKER_IDENTITY,
  DESIGN_WORKER_REPORT_VERSION,
  DW_METADATA_VERSION,
  EXPORT_FORMATS,
  PRODUCT_TYPES,
} from "./paths.js";
import type {
  BrandingThemeDetails,
  DesignAsset,
  DesignContext,
  DesignWorkerCatalog,
  DesignWorkerInput,
  DesignWorkerReport,
  ExportFormat,
  IntegrationHandshake,
  ProductType,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

/** Pure Design Worker helpers for Q5-07 — visual design assets only (structural signals). */
export class DesignBuilder {
  buildCatalog(
    config: DesignWorkerConfiguration,
    designReports: DesignWorkerReport[],
    integrations: IntegrationHandshake[],
  ): DesignWorkerCatalog {
    return {
      reportVersion: DESIGN_WORKER_REPORT_VERSION,
      workerId: config.workerId,
      designReports: designReports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: DW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishAssetsDirectly: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(
    input: DesignWorkerInput,
    context: DesignContext,
    enrichment?: DprEnrichmentContext | null,
  ): DesignContext {
    const receivedProductInformation =
      context.receivedProductInformation ||
      Boolean(input.researchReportId?.trim()) ||
      Boolean(enrichment?.researchReportId?.trim()) ||
      Boolean(input.researchTopic?.trim()) ||
      Boolean(enrichment?.researchTopic?.trim()) ||
      Boolean(input.productTitle?.trim()) ||
      Boolean(enrichment?.productTitle?.trim());
    return {
      researchReportId:
        input.researchReportId ?? enrichment?.researchReportId ?? context.researchReportId ?? null,
      opportunityId:
        input.opportunityId ?? enrichment?.opportunityId ?? context.opportunityId ?? null,
      businessId: input.businessId ?? enrichment?.businessId ?? context.businessId ?? null,
      factoryMissionId:
        input.factoryMissionId ??
        enrichment?.factoryMissionId ??
        context.factoryMissionId ??
        null,
      productTitle:
        input.productTitle ?? enrichment?.productTitle ?? context.productTitle ?? null,
      productType: this.normalizeProductType(
        input.productType ?? enrichment?.productType ?? context.productType,
      ),
      targetAudience:
        input.targetAudience ?? enrichment?.targetAudience ?? context.targetAudience ?? null,
      customerPainPoints:
        input.customerPainPoints ??
        enrichment?.customerPainPoints ??
        context.customerPainPoints ??
        [],
      marketGap: input.marketGap ?? enrichment?.marketGap ?? context.marketGap ?? null,
      demandAssessment:
        input.demandAssessment ?? enrichment?.demandAssessment ?? context.demandAssessment ?? null,
      researchTopic:
        input.researchTopic ?? enrichment?.researchTopic ?? context.researchTopic ?? null,
      brandingTheme: input.brandingTheme ?? context.brandingTheme ?? null,
      receivedProductInformation,
    };
  }

  canBuildDesignReport(context: DesignContext): { ready: boolean; reason?: string } {
    if (
      !context.receivedProductInformation &&
      !context.researchReportId &&
      !context.researchTopic &&
      !context.productTitle
    ) {
      return {
        ready: false,
        reason:
          "Approved digital product information required (researchReportId, researchTopic, or productTitle)",
      };
    }
    return { ready: true };
  }

  createDesignReportShell(
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
    context: DesignContext,
  ): DesignWorkerReport {
    designSequence += 1;
    const now = new Date().toISOString();
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const designReportId =
      input.designReportId?.trim() || `dw-dsr-${Date.now()}-${designSequence}`;
    const productId = input.productId?.trim() || `dw-prd-${Date.now()}-${designSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-dw-${designSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-dw-${designSequence}`;
    const productCategory =
      input.productCategory?.trim() || this.humanizeCategory(productType);
    const brandingTheme =
      input.brandingTheme?.trim() ||
      context.brandingTheme?.trim() ||
      this.defaultBrandingTheme(productTitle);

    return {
      designReportId,
      timestamp: now,
      productId,
      productTitle,
      assetTypesCreated: [],
      brandingTheme,
      previewAssets: [],
      mockupAssets: [],
      exportFormats: [],
      qualityReview: "",
      confidenceScore: 40,
      metadataVersion: DW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      productType,
      productCategory,
      brandingThemeDetails: this.buildThemeDetails(brandingTheme, productTitle),
      ebookCovers: [],
      courseCovers: [],
      brandingAssets: [],
      promotionalGraphics: [],
      allAssets: [],
      brandingConsistencyValidated: false,
      selfReviewPassed: false,
      selfReviewFindings: [],
      selfReviewSummary: "Shell created — design stages pending",
      researchCompliance: "partial",
      researchComplianceNotes: "Awaiting visual asset generation from approved product intent",
      workerId: config.workerId || DESIGN_WORKER_IDENTITY.workerId,
      reportVersion: DESIGN_WORKER_REPORT_VERSION,
      traceabilityRefs: unique([
        `designReport:${designReportId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        `type:${productType}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `dw-dec-${designSequence}-shell`,
          topic: productTitle,
          decision:
            "Materialized fresh design report shell from approved product information — no sales/publish/delivery",
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishAssetsDirectly: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ508OrLater: true,
      followApprovedProductIntent: true,
      produceOriginalVisualAssets: true,
      maintainConsistentBranding: true,
      preserveCompleteTraceability: true,
      performQualityReviewBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  generateEbookCovers(context: DesignContext, assetCount: number): DesignAsset[] {
    const title = this.resolveTitle(context);
    const theme = context.brandingTheme?.trim() || this.defaultBrandingTheme(title);
    const count = clamp(assetCount, 1, 6);
    return Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return {
        assetId: `dw-ast-ebook-${designSequence || 1}-${n}`,
        title: `${title} — Ebook Cover ${n}`,
        assetType: "ebook_cover",
        description: `Original ebook cover concept for '${title}' using ${theme} palette. Centered title lockup, subtle texture, and professional digital-product framing. Structural signal only — not a binary image blob.`,
        dimensions: n === 1 ? "1600x2560" : n === 2 ? "1400x2100" : "2560x1600",
        formatHint: "png_ready",
      };
    });
  }

  generateCourseCovers(context: DesignContext, assetCount: number): DesignAsset[] {
    const title = this.resolveTitle(context);
    const theme = context.brandingTheme?.trim() || this.defaultBrandingTheme(title);
    const audience = context.targetAudience?.trim() || "learners";
    const count = clamp(assetCount, 1, 6);
    return Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return {
        assetId: `dw-ast-course-${designSequence || 1}-${n}`,
        title: `${title} — Course Cover ${n}`,
        assetType: "course_cover",
        description: `Course cover layout for '${title}' aimed at ${audience}. Bold headline hierarchy, module badge area, and ${theme} accent bands. Structural signal only.`,
        dimensions: n === 1 ? "1920x1080" : "1280x720",
        formatHint: "jpg_ready",
      };
    });
  }

  generateProductBrandingAssets(context: DesignContext, assetCount: number): DesignAsset[] {
    const title = this.resolveTitle(context);
    const theme = context.brandingTheme?.trim() || this.defaultBrandingTheme(title);
    const details = this.buildThemeDetails(theme, title);
    const count = clamp(assetCount, 2, 8);
    const assets: DesignAsset[] = [
      {
        assetId: `dw-ast-brand-${designSequence || 1}-palette`,
        title: `${title} Brand Palette`,
        assetType: "branding_assets",
        description: `Brand palette for '${title}': primary ${details.primaryColor}, accent ${details.accentColor}, typography ${details.typography}, mood ${details.mood}. Theme name: ${theme}.`,
        dimensions: "1200x800",
        formatHint: "png_ready",
      },
      {
        assetId: `dw-ast-brand-${designSequence || 1}-mark`,
        title: `${title} Wordmark / Icon Set`,
        assetType: "product_icons",
        description: `Wordmark and icon set for '${title}' with consistent stroke weight and ${theme} color application. Structural signal only.`,
        dimensions: "512x512",
        formatHint: "svg_ready",
      },
    ];
    for (let i = 3; i <= count; i++) {
      assets.push({
        assetId: `dw-ast-brand-${designSequence || 1}-${i}`,
        title: `${title} Branding Asset ${i}`,
        assetType: "branding_assets",
        description: `Supporting branding graphic ${i} for '${title}' maintaining ${theme} consistency across digital product surfaces.`,
        dimensions: "1080x1080",
        formatHint: "png_ready",
      });
    }
    return assets;
  }

  generatePromotionalGraphics(context: DesignContext, assetCount: number): DesignAsset[] {
    const title = this.resolveTitle(context);
    const theme = context.brandingTheme?.trim() || this.defaultBrandingTheme(title);
    const pain =
      context.customerPainPoints?.[0] ?? "unclear product value and weak visual identity";
    const count = clamp(assetCount, 1, 6);
    return Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return {
        assetId: `dw-ast-promo-${designSequence || 1}-${n}`,
        title: `${title} — Promo Graphic ${n}`,
        assetType: "promotional_graphics",
        description: `Promotional graphic for '${title}' highlighting value against '${pain}'. Uses ${theme} accents, short headline area, and CTA-safe negative space. Not a sales page — structural promo asset only.`,
        dimensions: n % 2 === 0 ? "1200x628" : "1080x1350",
        formatHint: n % 2 === 0 ? "jpg_ready" : "png_ready",
      };
    });
  }

  generateRealisticProductMockups(context: DesignContext, assetCount: number): DesignAsset[] {
    const title = this.resolveTitle(context);
    const theme = context.brandingTheme?.trim() || this.defaultBrandingTheme(title);
    const count = clamp(assetCount, 1, 5);
    const scenes = [
      "desktop browser mockup with product landing preview frame",
      "tablet mockup showing course / ebook cover placement",
      "phone mockup with social preview card",
      "flat-lay digital toolkit mockup with icon grid",
      "marketplace listing mockup thumbnail frame",
    ];
    return Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return {
        assetId: `dw-ast-mock-${designSequence || 1}-${n}`,
        title: `${title} — Product Mockup ${n}`,
        assetType: "mockups",
        description: `Realistic ${scenes[i % scenes.length]} for '${title}' in ${theme} styling. Soft shadows, clean perspective, structural description only — no binary image payload.`,
        dimensions: "2400x1600",
        formatHint: "png_ready",
      };
    });
  }

  generatePreviewImages(context: DesignContext, assetCount: number): DesignAsset[] {
    const title = this.resolveTitle(context);
    const theme = context.brandingTheme?.trim() || this.defaultBrandingTheme(title);
    const count = clamp(assetCount, 1, 6);
    return Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return {
        assetId: `dw-ast-prev-${designSequence || 1}-${n}`,
        title: `${title} — Preview Image ${n}`,
        assetType: "preview_images",
        description: `Storefront / gallery preview frame ${n} for '${title}'. Shows cropped cover + branding strip in ${theme}. Dimensions tuned for marketplace thumbs. Structural signal only.`,
        dimensions: n === 1 ? "1280x720" : "800x800",
        formatHint: "jpg_ready",
      };
    });
  }

  maintainVisualBrandingConsistency(
    report: Pick<
      DesignWorkerReport,
      | "brandingTheme"
      | "brandingThemeDetails"
      | "ebookCovers"
      | "courseCovers"
      | "brandingAssets"
      | "promotionalGraphics"
      | "previewAssets"
      | "mockupAssets"
    >,
  ): { brandingConsistencyValidated: boolean; notes: string } {
    const theme = report.brandingTheme?.trim();
    const hasTheme = Boolean(theme);
    const hasPalette =
      Boolean(report.brandingThemeDetails?.primaryColor) &&
      Boolean(report.brandingThemeDetails?.accentColor);
    const assetGroups = [
      report.ebookCovers,
      report.courseCovers,
      report.brandingAssets,
      report.promotionalGraphics,
      report.previewAssets,
      report.mockupAssets,
    ];
    const totalAssets = assetGroups.reduce((n, g) => n + g.length, 0);
    const themeMentioned =
      totalAssets === 0 ||
      assetGroups.every((group) =>
        group.every(
          (a) =>
            !theme ||
            a.description.toLowerCase().includes(theme.toLowerCase()) ||
            a.description.toLowerCase().includes("brand"),
        ),
      );
    const validated = hasTheme && hasPalette && (totalAssets === 0 || themeMentioned);
    return {
      brandingConsistencyValidated: validated,
      notes: validated
        ? `Branding consistency validated for theme '${theme}' across ${totalAssets} structural assets.`
        : `Branding consistency incomplete — theme/palette/asset alignment needs attention.`,
    };
  }

  prepareExportFormats(): ExportFormat[] {
    return [...EXPORT_FORMATS];
  }

  performQualityReview(
    report: Pick<
      DesignWorkerReport,
      | "productTitle"
      | "brandingTheme"
      | "ebookCovers"
      | "courseCovers"
      | "brandingAssets"
      | "promotionalGraphics"
      | "previewAssets"
      | "mockupAssets"
      | "exportFormats"
      | "assetTypesCreated"
      | "brandingConsistencyValidated"
      | "researchReportId"
    >,
    context: DesignContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 70;
    const coverCount = report.ebookCovers.length + report.courseCovers.length;
    if (!coverCount && !report.brandingAssets.length) {
      findings.push({
        findingId: `dw-f-${designSequence}-assets`,
        category: "content",
        severity: "error",
        message: "No visual design assets present",
      });
      score -= 20;
    } else {
      score += 8;
    }
    if (!report.ebookCovers.length) {
      findings.push({
        findingId: `dw-f-${designSequence}-ebook`,
        category: "ebook_covers",
        severity: "warning",
        message: "Ebook covers not yet included",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.courseCovers.length) {
      findings.push({
        findingId: `dw-f-${designSequence}-course`,
        category: "course_covers",
        severity: "warning",
        message: "Course covers not yet included",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.brandingAssets.length) {
      findings.push({
        findingId: `dw-f-${designSequence}-branding`,
        category: "branding",
        severity: "warning",
        message: "Branding assets not yet included",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!report.promotionalGraphics.length) {
      findings.push({
        findingId: `dw-f-${designSequence}-promo`,
        category: "promotional_graphics",
        severity: "warning",
        message: "Promotional graphics not yet included",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.mockupAssets.length) {
      findings.push({
        findingId: `dw-f-${designSequence}-mockups`,
        category: "mockups",
        severity: "warning",
        message: "Mockup assets not yet included",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.previewAssets.length) {
      findings.push({
        findingId: `dw-f-${designSequence}-previews`,
        category: "preview_images",
        severity: "warning",
        message: "Preview images not yet included",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.exportFormats.length) {
      findings.push({
        findingId: `dw-f-${designSequence}-export`,
        category: "export",
        severity: "warning",
        message: "Export formats incomplete",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.brandingConsistencyValidated) {
      findings.push({
        findingId: `dw-f-${designSequence}-consistency`,
        category: "branding_consistency",
        severity: "warning",
        message: "Branding consistency not yet validated",
      });
      score -= 4;
    } else {
      score += 5;
    }
    if (!report.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `dw-f-${designSequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; intent derived from available context",
      });
      score -= 4;
    } else {
      score += 6;
    }

    const confidenceScore = clamp(score, 0, 100);
    const hasCoreAssets =
      report.brandingAssets.length > 0 ||
      report.ebookCovers.length > 0 ||
      report.courseCovers.length > 0;
    const passed = findings.every((f) => f.severity !== "error") && hasCoreAssets;
    const brandingConsistencyValidated = report.brandingConsistencyValidated && passed;
    const researchCompliance =
      report.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const summary = passed
      ? `Quality review passed for '${report.productTitle}' with confidence ${confidenceScore}/100. Visual assets (covers, branding, promos, mockups, previews) are export-ready as structural signals only.`
      : `Quality review incomplete for '${report.productTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;
    const qualityReview = passed
      ? `Quality review: original visual assets present (ebook=${report.ebookCovers.length}, course=${report.courseCovers.length}, branding=${report.brandingAssets.length}, promo=${report.promotionalGraphics.length}, mockups=${report.mockupAssets.length}, previews=${report.previewAssets.length}); brandingConsistencyValidated=${report.brandingConsistencyValidated}; researchCompliance=${researchCompliance}.`
      : `Quality review: gaps remain — ${findings.map((f) => f.message).join("; ")}.`;

    return {
      passed,
      summary,
      qualityReview,
      findings,
      confidenceScore,
      researchCompliance,
      researchComplianceNotes:
        researchCompliance === "compliant"
          ? "Design pack follows approved digital product intent"
          : "Design pack partially aligned to available product information signals",
      brandingConsistencyValidated,
    };
  }

  buildDesignReport(
    input: DesignWorkerInput,
    config: DesignWorkerConfiguration,
    context: DesignContext,
  ): DesignWorkerReport {
    designSequence += 1;
    const now = new Date().toISOString();
    const assetCount = clamp(input.assetCount ?? config.defaultAssetCount ?? 3, 2, 10);
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const designReportId =
      input.designReportId?.trim() || `dw-dsr-${Date.now()}-${designSequence}`;
    const productId = input.productId?.trim() || `dw-prd-${Date.now()}-${designSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-dw-${designSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-dw-${designSequence}`;
    const productCategory =
      input.productCategory?.trim() || this.humanizeCategory(productType);
    const brandingTheme =
      input.brandingTheme?.trim() ||
      context.brandingTheme?.trim() ||
      this.defaultBrandingTheme(productTitle);
    const brandingThemeDetails = this.buildThemeDetails(brandingTheme, productTitle);
    const contextWithTheme: DesignContext = { ...context, brandingTheme };

    const ebookCovers = this.generateEbookCovers(contextWithTheme, assetCount);
    const courseCovers = this.generateCourseCovers(contextWithTheme, assetCount);
    const brandingAssets = this.generateProductBrandingAssets(contextWithTheme, assetCount);
    const promotionalGraphics = this.generatePromotionalGraphics(contextWithTheme, assetCount);
    const mockupAssets = this.generateRealisticProductMockups(contextWithTheme, assetCount);
    const previewAssets = this.generatePreviewImages(contextWithTheme, assetCount);
    const exportFormats = this.prepareExportFormats();
    const consistency = this.maintainVisualBrandingConsistency({
      brandingTheme,
      brandingThemeDetails,
      ebookCovers,
      courseCovers,
      brandingAssets,
      promotionalGraphics,
      previewAssets,
      mockupAssets,
    });
    const allAssets = [
      ...ebookCovers,
      ...courseCovers,
      ...brandingAssets,
      ...promotionalGraphics,
      ...mockupAssets,
      ...previewAssets,
    ];
    const assetTypesCreated = unique(allAssets.map((a) => a.assetType));
    const draftForReview = {
      productTitle,
      brandingTheme,
      ebookCovers,
      courseCovers,
      brandingAssets,
      promotionalGraphics,
      previewAssets,
      mockupAssets,
      exportFormats,
      assetTypesCreated,
      brandingConsistencyValidated: consistency.brandingConsistencyValidated,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
    };
    const review = this.performQualityReview(draftForReview, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    const traceabilityRefs = unique([
      `designReport:${designReportId}`,
      `product:${productId}`,
      `business:${businessId}`,
      `mission:${factoryMissionId}`,
      ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
      ...(context.opportunityId ? [`opportunity:${context.opportunityId}`] : []),
      `type:${productType}`,
    ]);
    const preservedDecisions = [
      {
        decisionId: `dw-dec-${designSequence}-pack`,
        topic: productTitle,
        decision: `Built visual design pack (${allAssets.length} structural assets) for ${productType} — assets only, no sales/publish/delivery`,
        recordedAt: now,
      },
      {
        decisionId: `dw-dec-${designSequence}-export`,
        topic: productTitle,
        decision: `Prepared structural export signals (${exportFormats.join(", ")}) without publishing or delivering products`,
        recordedAt: now,
      },
    ];

    return {
      designReportId,
      timestamp: now,
      productId,
      productTitle,
      assetTypesCreated,
      brandingTheme,
      previewAssets,
      mockupAssets,
      exportFormats,
      qualityReview: review.qualityReview,
      confidenceScore,
      metadataVersion: DW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      productType,
      productCategory,
      brandingThemeDetails,
      ebookCovers,
      courseCovers,
      brandingAssets,
      promotionalGraphics,
      allAssets,
      brandingConsistencyValidated: consistency.brandingConsistencyValidated,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      workerId: config.workerId || DESIGN_WORKER_IDENTITY.workerId,
      reportVersion: DESIGN_WORKER_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishAssetsDirectly: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ508OrLater: true,
      followApprovedProductIntent: true,
      produceOriginalVisualAssets: true,
      maintainConsistentBranding: true,
      preserveCompleteTraceability: true,
      performQualityReviewBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  normalizeProductType(type: string | ProductType | null | undefined): ProductType {
    const raw = type?.trim() ?? "";
    if (raw && (PRODUCT_TYPES as readonly string[]).includes(raw)) {
      return raw as ProductType;
    }
    const lower = raw.toLowerCase();
    switch (lower) {
      case "ebook":
      case "ebook_covers":
      case "cover":
        return "ebook_cover";
      case "course":
      case "course_covers":
        return "course_cover";
      case "product":
      case "cover_art":
        return "product_cover";
      case "graphics":
      case "product_graphic":
        return "product_graphics";
      case "promo":
      case "promotional":
      case "social_promo":
        return "promotional_graphics";
      case "mockup":
      case "product_mockup":
        return "mockups";
      case "preview":
      case "previews":
        return "preview_images";
      case "branding":
      case "brand":
      case "identity":
        return "branding_assets";
      case "social":
      case "social_media":
        return "social_media_assets";
      case "icon":
      case "icons":
        return "product_icons";
      case "template_pack":
      case "prompt_pack":
      case "digital_toolkit":
        return "branding_assets";
      default:
        return raw ? "unknown" : "branding_assets";
    }
  }

  humanizeCategory(productType: ProductType | string): string {
    return String(productType)
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private resolveTitle(context: DesignContext, input?: DesignWorkerInput): string {
    return (
      input?.productTitle?.trim() ||
      context.productTitle?.trim() ||
      context.researchTopic?.trim() ||
      "Digital Product Design Pack"
    );
  }

  private defaultBrandingTheme(productTitle: string): string {
    const slug = productTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 24);
    return `${slug || "empire"}_visual_theme`;
  }

  private buildThemeDetails(theme: string, productTitle: string): BrandingThemeDetails {
    const hash = [...theme, ...productTitle].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const hues = [210, 24, 160, 280, 36, 190];
    const primaryHue = hues[hash % hues.length]!;
    const accentHue = hues[(hash + 2) % hues.length]!;
    const fonts = ["Inter Display", "Source Serif", "Space Grotesk", "IBM Plex Sans"];
    const moods = ["confident", "calm premium", "energetic", "editorial", "minimal"];
    return {
      primaryColor: `hsl(${primaryHue} 55% 32%)`,
      accentColor: `hsl(${accentHue} 65% 48%)`,
      typography: fonts[hash % fonts.length]!,
      mood: moods[hash % moods.length]!,
    };
  }
}

let designSequence = 0;

export function resetDesignSequenceForTesting() {
  designSequence = 0;
}

function cloneReport(report: DesignWorkerReport): DesignWorkerReport {
  return {
    ...report,
    assetTypesCreated: [...report.assetTypesCreated],
    exportFormats: [...report.exportFormats],
    previewAssets: report.previewAssets.map((a) => ({ ...a })),
    mockupAssets: report.mockupAssets.map((a) => ({ ...a })),
    ebookCovers: report.ebookCovers.map((a) => ({ ...a })),
    courseCovers: report.courseCovers.map((a) => ({ ...a })),
    brandingAssets: report.brandingAssets.map((a) => ({ ...a })),
    promotionalGraphics: report.promotionalGraphics.map((a) => ({ ...a })),
    allAssets: report.allAssets.map((a) => ({ ...a })),
    brandingThemeDetails: { ...report.brandingThemeDetails },
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
