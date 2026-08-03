import type { SalesPageWorkerConfiguration } from "./configuration.js";
import type { EnrichmentContext } from "./integrations.js";
import {
  EXPORT_FORMATS,
  PRODUCT_TYPES,
  SALES_PAGE_WORKER_IDENTITY,
  SALES_PAGE_WORKER_REPORT_VERSION,
  SPW_METADATA_VERSION,
} from "./paths.js";
import type {
  CtaBlock,
  ExportFormat,
  FaqItem,
  FeatureSection,
  GuaranteeBlock,
  IntegrationHandshake,
  LandingPageSection,
  PageType,
  PricingPresentation,
  ProductType,
  SalesPageContext,
  SalesPageReport,
  SalesPageWorkerCatalog,
  SalesPageWorkerInput,
  SalesTestimonial,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

/** Pure Sales Page Worker helpers for Q5-08 — sales copy + structure (structural signals). */
export class SalesPageBuilder {
  buildCatalog(
    config: SalesPageWorkerConfiguration,
    salesPages: SalesPageReport[],
    integrations: IntegrationHandshake[],
  ): SalesPageWorkerCatalog {
    return {
      reportVersion: SALES_PAGE_WORKER_REPORT_VERSION,
      workerId: config.workerId,
      salesPages: salesPages.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: SPW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishWebsites: true,
      neverPublishPagesDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricateTestimonials: true,
    };
  }

  mergeContext(
    input: SalesPageWorkerInput,
    context: SalesPageContext,
    enrichment?: EnrichmentContext | null,
  ): SalesPageContext {
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
      productType: this.normalizePageType(
        input.productType ?? enrichment?.productType ?? context.productType,
      ),
      pageType: this.normalizePageType(
        input.pageType ?? input.productType ?? enrichment?.productType ?? context.pageType,
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
      productDescription:
        input.productDescription ?? enrichment?.productDescription ?? context.productDescription ?? null,
      pricingHint: input.pricingHint ?? context.pricingHint ?? null,
      approvedTestimonials:
        input.approvedTestimonials ?? context.approvedTestimonials ?? null,
      designAssetRefs: unique([
        ...(context.designAssetRefs ?? []),
        ...(enrichment?.designAssetRefs ?? []),
      ]),
      receivedProductInformation,
    };
  }

  canBuildSalesPage(context: SalesPageContext): { ready: boolean; reason?: string } {
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

  createSalesPageShell(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
    context: SalesPageContext,
  ): SalesPageReport {
    salesPageSequence += 1;
    const now = new Date().toISOString();
    const pageType = this.normalizePageType(
      input.pageType ?? input.productType ?? context.pageType ?? config.defaultPageType,
    );
    const productTitle = this.resolveTitle(context, input);
    const salesPageId =
      input.salesPageId?.trim() || `spw-spg-${Date.now()}-${salesPageSequence}`;
    const productId = input.productId?.trim() || `spw-prd-${Date.now()}-${salesPageSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-spw-${salesPageSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-spw-${salesPageSequence}`;

    return {
      salesPageId,
      timestamp: now,
      productId,
      productTitle,
      landingPageStructure: [],
      headline: "",
      ctaSummary: "",
      sectionsGenerated: [],
      assetsReferenced: [...(context.designAssetRefs ?? [])],
      complianceReview:
        "Pending — no fabricated testimonials; no payments or publishing in scope.",
      qualityReview: "",
      confidenceScore: 40,
      metadataVersion: SPW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      pageType,
      productType: pageType,
      headlines: [],
      benefitCopy: "",
      featureSections: [],
      pricingPresentation: null,
      testimonials: [],
      faqs: [],
      ctas: [],
      guarantees: [],
      exportFormats: [],
      readabilityOptimized: false,
      conversionOptimized: false,
      selfReviewPassed: false,
      selfReviewFindings: [],
      selfReviewSummary: "Shell created — sales page stages pending",
      researchCompliance: "partial",
      researchComplianceNotes: "Awaiting sales copy generation from approved product information",
      workerId: config.workerId || SALES_PAGE_WORKER_IDENTITY.workerId,
      reportVersion: SALES_PAGE_WORKER_REPORT_VERSION,
      traceabilityRefs: unique([
        `salesPage:${salesPageId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        `type:${pageType}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `spw-dec-${salesPageSequence}-shell`,
          topic: productTitle,
          decision:
            "Materialized fresh sales page shell from approved product information — copy/structure only, no payments/publishing/delivery",
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishWebsites: true,
      neverPublishPagesDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ509OrLater: true,
      neverFabricateTestimonials: true,
      followApprovedProductInformation: true,
      produceOriginalSalesCopy: true,
      preserveCompleteTraceability: true,
      maintainEmpireAiBrandingStandards: true,
      performQualityReviewBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  generateCompleteLandingPageStructure(context: SalesPageContext): LandingPageSection[] {
    const title = this.resolveTitle(context);
    const pageType = this.normalizePageType(context.pageType ?? context.productType);
    const sectionDefs: Array<{ sectionType: string; title: string; summary: string }> = [
      {
        sectionType: "hero",
        title: `${title} — Hero`,
        summary: `Primary hero for ${pageType} introducing ${title} to ${context.targetAudience || "the target audience"}.`,
      },
      {
        sectionType: "problem",
        title: "The Challenge",
        summary: `Problem framing drawn from approved pain points for '${title}'.`,
      },
      {
        sectionType: "solution",
        title: "The Solution",
        summary: `Position '${title}' as the clear path forward.`,
      },
      {
        sectionType: "benefits",
        title: "Key Benefits",
        summary: "Benefit-driven outcomes the buyer can expect.",
      },
      {
        sectionType: "features",
        title: "What's Included",
        summary: "Feature breakdown of the digital product offer.",
      },
      {
        sectionType: "pricing",
        title: "Investment",
        summary: "Pricing presentation structure (no payment processing).",
      },
      {
        sectionType: "testimonials",
        title: "Social Proof",
        summary: "Approved testimonials or clearly labeled placeholders only.",
      },
      {
        sectionType: "faq",
        title: "Frequently Asked Questions",
        summary: "Objection-handling FAQ block.",
      },
      {
        sectionType: "guarantee",
        title: "Guarantee",
        summary: "Risk-reversal guarantee language.",
      },
      {
        sectionType: "cta",
        title: "Call to Action",
        summary: "Primary and secondary CTA placements (structural only).",
      },
    ];
    return sectionDefs.map((def, i) => ({
      sectionId: `spw-sec-${salesPageSequence || 1}-${i + 1}`,
      sectionType: def.sectionType,
      title: def.title,
      order: i + 1,
      summary: def.summary,
    }));
  }

  generateCompellingHeadlines(context: SalesPageContext): string[] {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "ambitious creators";
    const pain =
      context.customerPainPoints?.[0] ?? "scattered tools and unclear next steps";
    return [
      `${title}: Turn ${pain} Into a Clear, Repeatable System`,
      `The ${title} Advantage for ${audience}`,
      `Stop Guessing. Start Shipping With ${title}`,
      `${title} — Built for ${audience} Who Want Results Without the Noise`,
    ];
  }

  generateBenefitDrivenCopy(context: SalesPageContext): string {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "your ideal customers";
    const pains = (context.customerPainPoints ?? []).slice(0, 3);
    const painLine =
      pains.length > 0
        ? pains.map((p) => `less ${p}`).join(", ")
        : "less friction, clearer positioning, and faster momentum";
    const gap = context.marketGap?.trim() || "an underserved demand for practical digital products";
    const desc =
      context.productDescription?.trim() ||
      `${title} is an original digital offer designed to help ${audience} move from intention to execution.`;
    return [
      desc,
      `With ${title}, ${audience} get ${painLine}.`,
      `It addresses ${gap} while staying aligned to approved product information — original sales copy only, never fabricated social proof.`,
      `Every section on this page is structured for readability and conversion readiness as a structural signal, not a published website.`,
    ].join(" ");
  }

  generateFeatureSections(context: SalesPageContext): FeatureSection[] {
    const title = this.resolveTitle(context);
    const features = [
      {
        title: "Clear Offer Narrative",
        body: `A sharp story that explains what '${title}' is, who it is for, and why it matters now.`,
      },
      {
        title: "Practical Deliverables",
        body: `Structured digital assets and guidance that help buyers apply '${title}' immediately after purchase readiness (delivery handled by later stages).`,
      },
      {
        title: "Audience-Fit Framing",
        body: `Messaging tuned for ${context.targetAudience?.trim() || "the approved target audience"} using approved product information only.`,
      },
      {
        title: "Conversion-Ready Layout",
        body: "Section order optimized for scanability: hero → problem → solution → proof → offer → FAQ → CTA.",
      },
    ];
    return features.map((f, i) => ({
      sectionId: `spw-sec-feat-${salesPageSequence || 1}-${i + 1}`,
      title: f.title,
      body: f.body,
      order: i + 1,
    }));
  }

  generatePricingPresentation(context: SalesPageContext): PricingPresentation {
    const title = this.resolveTitle(context);
    const hint = context.pricingHint?.trim() || "Investment presented as structural copy only";
    return {
      sectionId: `spw-sec-price-${salesPageSequence || 1}`,
      headline: `Choose How You Want to Start With ${title}`,
      tiers: [
        {
          name: "Starter",
          priceLabel: "Core access",
          includes: [`Core ${title} materials`, "Getting-started checklist", "Self-paced structure"],
        },
        {
          name: "Pro",
          priceLabel: "Expanded pack",
          includes: [
            "Everything in Starter",
            "Expanded templates / modules",
            "Implementation prompts",
          ],
        },
        {
          name: "Complete",
          priceLabel: "Full system",
          includes: [
            "Everything in Pro",
            "Bonus frameworks",
            "Priority-ready packaging notes",
          ],
        },
      ],
      notes: `${hint}. Pricing presentation is structural sales copy only — Sales Page Worker never processes payments.`,
    };
  }

  generateTestimonialsOrPlaceholders(context: SalesPageContext): SalesTestimonial[] {
    const approved = context.approvedTestimonials ?? [];
    if (approved.length > 0) {
      return approved.map((t, i) => ({
        testimonialId: `spw-tst-${salesPageSequence || 1}-${i + 1}`,
        quote: t.quote.trim(),
        attribution: t.attribution?.trim() || "Approved customer",
        fabricated: false as const,
        status: "approved" as const,
        approved: true,
      }));
    }
    return [1, 2].map((n) => ({
      testimonialId: `spw-tst-${salesPageSequence || 1}-ph-${n}`,
      quote: "Testimonial placeholder — awaiting approved customer quote",
      attribution: "Placeholder",
      fabricated: false as const,
      status: "placeholder" as const,
      approved: false,
    }));
  }

  generateFaqSections(context: SalesPageContext): FaqItem[] {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "buyers";
    return [
      {
        faqId: `spw-faq-${salesPageSequence || 1}-1`,
        question: `Who is ${title} for?`,
        answer: `${title} is designed for ${audience} who want a practical digital product path without guesswork.`,
      },
      {
        faqId: `spw-faq-${salesPageSequence || 1}-2`,
        question: `What do I get with ${title}?`,
        answer: `You receive the structured digital product materials described in the feature sections — exact delivery is handled by downstream fulfillment stages, not this worker.`,
      },
      {
        faqId: `spw-faq-${salesPageSequence || 1}-3`,
        question: "Is there a guarantee?",
        answer:
          "A clear guarantee section is included on this page. Terms are presented as structural copy only.",
      },
      {
        faqId: `spw-faq-${salesPageSequence || 1}-4`,
        question: "Will this page process my payment?",
        answer:
          "No. The Sales Page Worker produces sales copy and structure only — it never processes payments or publishes live pages.",
      },
    ];
  }

  generateCallToActionSections(context: SalesPageContext): CtaBlock[] {
    const title = this.resolveTitle(context);
    return [
      {
        ctaId: `spw-cta-${salesPageSequence || 1}-1`,
        label: `Get ${title}`,
        supportingCopy: `Start with ${title} and move from interest to a clear next step.`,
        placement: "hero",
      },
      {
        ctaId: `spw-cta-${salesPageSequence || 1}-2`,
        label: "See What's Included",
        supportingCopy: "Jump to the feature and pricing sections before you decide.",
        placement: "mid_page",
      },
      {
        ctaId: `spw-cta-${salesPageSequence || 1}-3`,
        label: `Claim ${title} Today`,
        supportingCopy:
          "Primary closing CTA — structural signal only; no payment or page publishing.",
        placement: "footer",
      },
    ];
  }

  generateGuaranteeSections(context: SalesPageContext): GuaranteeBlock[] {
    const title = this.resolveTitle(context);
    return [
      {
        guaranteeId: `spw-gua-${salesPageSequence || 1}-1`,
        title: "Clarity Guarantee",
        body: `If ${title} does not provide a clear path for your use case as described, you can follow the stated refund / satisfaction policy presented here as structural copy only.`,
      },
      {
        guaranteeId: `spw-gua-${salesPageSequence || 1}-2`,
        title: "No Fabricated Proof Promise",
        body: "This page uses only approved testimonials or clearly labeled placeholders — never invented customer results.",
      },
    ];
  }

  optimizePageStructureForReadabilityAndConversion(
    report: Pick<
      SalesPageReport,
      | "landingPageStructure"
      | "headline"
      | "headlines"
      | "benefitCopy"
      | "featureSections"
      | "ctas"
      | "faqs"
      | "guarantees"
      | "pricingPresentation"
      | "testimonials"
    >,
  ): {
    landingPageStructure: LandingPageSection[];
    readabilityOptimized: boolean;
    conversionOptimized: boolean;
    qualityReview: string;
    exportFormats: ExportFormat[];
  } {
    const ordered = [...report.landingPageStructure].sort((a, b) => a.order - b.order);
    const hasHero = ordered.some((s) => s.sectionType === "hero");
    const hasCta = ordered.some((s) => s.sectionType === "cta") || report.ctas.length > 0;
    const hasBenefits = Boolean(report.benefitCopy?.trim()) ||
      ordered.some((s) => s.sectionType === "benefits");
    const readabilityOptimized =
      ordered.length >= 6 &&
      Boolean(report.headline?.trim() || report.headlines.length) &&
      hasBenefits &&
      report.faqs.length > 0;
    const conversionOptimized =
      hasHero &&
      hasCta &&
      Boolean(report.pricingPresentation) &&
      report.guarantees.length > 0 &&
      report.testimonials.length > 0;
    const qualityReview = [
      `Readability optimized=${readabilityOptimized}: section order scanned (${ordered.length} sections), headline present, benefits and FAQs available.`,
      `Conversion optimized=${conversionOptimized}: hero/CTA/pricing/guarantee/testimonial structure present.`,
      "Structural sales page content only — not a published website.",
    ].join(" ");
    return {
      landingPageStructure: ordered.map((s, i) => ({ ...s, order: i + 1 })),
      readabilityOptimized,
      conversionOptimized,
      qualityReview,
      exportFormats: this.prepareExportFormats(),
    };
  }

  prepareExportFormats(): ExportFormat[] {
    return [...EXPORT_FORMATS];
  }

  performQualityReview(
    report: Pick<
      SalesPageReport,
      | "productTitle"
      | "headline"
      | "landingPageStructure"
      | "benefitCopy"
      | "featureSections"
      | "pricingPresentation"
      | "testimonials"
      | "faqs"
      | "ctas"
      | "guarantees"
      | "ctaSummary"
      | "sectionsGenerated"
      | "readabilityOptimized"
      | "conversionOptimized"
      | "researchReportId"
      | "neverFabricateTestimonials"
    >,
    context: SalesPageContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 70;
    if (!report.landingPageStructure.length) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-structure`,
        category: "structure",
        severity: "error",
        message: "No landing page structure present",
      });
      score -= 20;
    } else {
      score += 8;
    }
    if (!report.headline?.trim()) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-headline`,
        category: "headlines",
        severity: "warning",
        message: "Headline not yet generated",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!report.benefitCopy?.trim()) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-benefits`,
        category: "benefits",
        severity: "warning",
        message: "Benefit-driven copy not yet generated",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.featureSections.length) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-features`,
        category: "features",
        severity: "warning",
        message: "Feature sections not yet generated",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.pricingPresentation) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-pricing`,
        category: "pricing",
        severity: "warning",
        message: "Pricing presentation not yet generated",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.testimonials.length) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-testimonials`,
        category: "testimonials",
        severity: "warning",
        message: "Testimonials/placeholders not yet generated",
      });
      score -= 3;
    } else {
      const fabricated = report.testimonials.some((t) => (t as { fabricated?: boolean }).fabricated);
      if (fabricated) {
        findings.push({
          findingId: `spw-f-${salesPageSequence}-fabricated`,
          category: "testimonials",
          severity: "error",
          message: "Fabricated testimonials are forbidden",
        });
        score -= 25;
      } else {
        score += 4;
      }
    }
    if (!report.faqs.length) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-faqs`,
        category: "faqs",
        severity: "warning",
        message: "FAQ sections not yet generated",
      });
      score -= 3;
    } else {
      score += 3;
    }
    if (!report.ctas.length) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-ctas`,
        category: "ctas",
        severity: "warning",
        message: "CTA sections not yet generated",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.guarantees.length) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-guarantees`,
        category: "guarantees",
        severity: "warning",
        message: "Guarantee sections not yet generated",
      });
      score -= 3;
    } else {
      score += 3;
    }
    if (!report.readabilityOptimized || !report.conversionOptimized) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-optimize`,
        category: "optimization",
        severity: "warning",
        message: "Page structure not yet optimized for readability and conversion",
      });
      score -= 4;
    } else {
      score += 5;
    }
    if (!report.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `spw-f-${salesPageSequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; intent derived from available context",
      });
      score -= 4;
    } else {
      score += 6;
    }

    const confidenceScore = clamp(score, 0, 100);
    const hasCore =
      report.landingPageStructure.length > 0 &&
      Boolean(report.headline?.trim()) &&
      Boolean(report.benefitCopy?.trim());
    const passed = findings.every((f) => f.severity !== "error") && hasCore;
    const researchCompliance =
      report.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const complianceReview =
      "Compliance review: no fabricated testimonials; no payment processing; no website/page publishing; original sales copy and structure only; approved product information followed.";
    const summary = passed
      ? `Quality review passed for '${report.productTitle}' with confidence ${confidenceScore}/100. Sales page structure and copy are ready as structural signals only.`
      : `Quality review incomplete for '${report.productTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;
    const qualityReview = passed
      ? `Quality review: structure=${report.landingPageStructure.length}, headline=present, features=${report.featureSections.length}, faqs=${report.faqs.length}, ctas=${report.ctas.length}, testimonials=${report.testimonials.length} (fabricated=false); readability=${report.readabilityOptimized}; conversion=${report.conversionOptimized}; researchCompliance=${researchCompliance}.`
      : `Quality review: gaps remain — ${findings.map((f) => f.message).join("; ")}.`;

    return {
      passed,
      summary,
      qualityReview,
      complianceReview,
      findings,
      confidenceScore,
      researchCompliance,
      researchComplianceNotes:
        researchCompliance === "compliant"
          ? "Sales page follows approved digital product information"
          : "Sales page partially aligned to available product information signals",
      readabilityOptimized: report.readabilityOptimized,
      conversionOptimized: report.conversionOptimized,
    };
  }

  buildSalesPageReport(
    input: SalesPageWorkerInput,
    config: SalesPageWorkerConfiguration,
    context: SalesPageContext,
  ): SalesPageReport {
    salesPageSequence += 1;
    const now = new Date().toISOString();
    const pageType = this.normalizePageType(
      input.pageType ?? input.productType ?? context.pageType ?? config.defaultPageType,
    );
    const productTitle = this.resolveTitle(context, input);
    const salesPageId =
      input.salesPageId?.trim() || `spw-spg-${Date.now()}-${salesPageSequence}`;
    const productId = input.productId?.trim() || `spw-prd-${Date.now()}-${salesPageSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-spw-${salesPageSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-spw-${salesPageSequence}`;

    const landingPageStructure = this.generateCompleteLandingPageStructure({
      ...context,
      pageType,
      productTitle,
    });
    const headlines = this.generateCompellingHeadlines({ ...context, productTitle });
    const benefitCopy = this.generateBenefitDrivenCopy({ ...context, productTitle });
    const featureSections = this.generateFeatureSections({ ...context, productTitle });
    const pricingPresentation = this.generatePricingPresentation({ ...context, productTitle });
    const testimonials = this.generateTestimonialsOrPlaceholders(context);
    const faqs = this.generateFaqSections({ ...context, productTitle });
    const ctas = this.generateCallToActionSections({ ...context, productTitle });
    const guarantees = this.generateGuaranteeSections({ ...context, productTitle });
    const optimization = this.optimizePageStructureForReadabilityAndConversion({
      landingPageStructure,
      headline: headlines[0] ?? "",
      headlines,
      benefitCopy,
      featureSections,
      ctas,
      faqs,
      guarantees,
      pricingPresentation,
      testimonials,
    });
    const sectionsGenerated = unique([
      ...optimization.landingPageStructure.map((s) => s.sectionType),
      "headlines",
      "benefits",
      "features",
      "pricing",
      "testimonials",
      "faqs",
      "ctas",
      "guarantees",
    ]);
    const ctaSummary = ctas.map((c) => `${c.placement}:${c.label}`).join(" | ");
    const draftForReview = {
      productTitle,
      headline: headlines[0] ?? "",
      landingPageStructure: optimization.landingPageStructure,
      benefitCopy,
      featureSections,
      pricingPresentation,
      testimonials,
      faqs,
      ctas,
      guarantees,
      ctaSummary,
      sectionsGenerated,
      readabilityOptimized: optimization.readabilityOptimized,
      conversionOptimized: optimization.conversionOptimized,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      neverFabricateTestimonials: true as const,
    };
    const review = this.performQualityReview(draftForReview, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    return {
      salesPageId,
      timestamp: now,
      productId,
      productTitle,
      landingPageStructure: optimization.landingPageStructure,
      headline: headlines[0] ?? "",
      ctaSummary,
      sectionsGenerated,
      assetsReferenced: [...(context.designAssetRefs ?? [])],
      complianceReview: review.complianceReview,
      qualityReview: optimization.qualityReview || review.qualityReview,
      confidenceScore,
      metadataVersion: SPW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      pageType,
      productType: pageType,
      headlines,
      benefitCopy,
      featureSections,
      pricingPresentation,
      testimonials,
      faqs,
      ctas,
      guarantees,
      exportFormats: optimization.exportFormats,
      readabilityOptimized: optimization.readabilityOptimized,
      conversionOptimized: optimization.conversionOptimized,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      workerId: config.workerId || SALES_PAGE_WORKER_IDENTITY.workerId,
      reportVersion: SALES_PAGE_WORKER_REPORT_VERSION,
      traceabilityRefs: unique([
        `salesPage:${salesPageId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        ...(context.opportunityId ? [`opportunity:${context.opportunityId}`] : []),
        `type:${pageType}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `spw-dec-${salesPageSequence}-pack`,
          topic: productTitle,
          decision: `Built sales page pack (${sectionsGenerated.length} section types) for ${pageType} — copy/structure only, no payments/publishing/delivery`,
          recordedAt: now,
        },
        {
          decisionId: `spw-dec-${salesPageSequence}-testimonials`,
          topic: productTitle,
          decision: testimonials.every((t) => t.status === "placeholder")
            ? "Used clearly labeled testimonial placeholders — no fabricated customer results"
            : "Used approved-provided testimonials only — fabricated=false",
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishWebsites: true,
      neverPublishPagesDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ509OrLater: true,
      neverFabricateTestimonials: true,
      followApprovedProductInformation: true,
      produceOriginalSalesCopy: true,
      preserveCompleteTraceability: true,
      maintainEmpireAiBrandingStandards: true,
      performQualityReviewBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  normalizePageType(type: string | ProductType | PageType | null | undefined): PageType {
    const raw = type?.trim() ?? "";
    if (raw && (PRODUCT_TYPES as readonly string[]).includes(raw)) {
      return raw as PageType;
    }
    const lower = raw.toLowerCase();
    switch (lower) {
      case "landing":
      case "landing_page":
      case "product":
      case "product_page":
        return "product_landing_page";
      case "long_form":
      case "longform":
      case "long_form_sales":
        return "long_form_sales_page";
      case "short_form":
      case "shortform":
        return "short_form_sales_page";
      case "lead_magnet":
      case "leadmagnet":
        return "lead_magnet_page";
      case "webinar":
      case "webinar_registration":
        return "webinar_registration_page";
      case "course":
      case "course_sales":
        return "course_sales_page";
      case "ebook":
      case "ebook_sales":
        return "ebook_sales_page";
      case "template":
      case "template_product":
        return "template_product_page";
      default:
        return raw ? "unknown" : "product_landing_page";
    }
  }

  private resolveTitle(context: SalesPageContext, input?: SalesPageWorkerInput): string {
    return (
      input?.productTitle?.trim() ||
      context.productTitle?.trim() ||
      context.researchTopic?.trim() ||
      "Digital Product Offer"
    );
  }
}

let salesPageSequence = 0;

export function resetSalesPageSequenceForTesting() {
  salesPageSequence = 0;
}

function cloneReport(report: SalesPageReport): SalesPageReport {
  return {
    ...report,
    landingPageStructure: report.landingPageStructure.map((s) => ({ ...s })),
    sectionsGenerated: [...report.sectionsGenerated],
    assetsReferenced: [...report.assetsReferenced],
    headlines: [...report.headlines],
    featureSections: report.featureSections.map((f) => ({ ...f })),
    pricingPresentation: report.pricingPresentation
      ? {
          ...report.pricingPresentation,
          tiers: report.pricingPresentation.tiers.map((t) => ({
            ...t,
            includes: [...t.includes],
          })),
        }
      : null,
    testimonials: report.testimonials.map((t) => ({ ...t, fabricated: false as const })),
    faqs: report.faqs.map((f) => ({ ...f })),
    ctas: report.ctas.map((c) => ({ ...c })),
    guarantees: report.guarantees.map((g) => ({ ...g })),
    exportFormats: [...report.exportFormats],
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
