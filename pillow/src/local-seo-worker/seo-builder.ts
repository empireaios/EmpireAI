import type { ServiceOfferReport } from "../service-offer-worker/types.js";
import type { LocalSeoWorkerConfiguration } from "./configuration.js";
import {
  LOCAL_SEO_REPORT_VERSION,
  LOCAL_SEO_WORKER_IDENTITY,
  LSEO_METADATA_VERSION,
} from "./paths.js";
import {
  provideCitationRecommendations,
  provideCityAreaPages,
  provideCompletenessEvaluation,
  provideGoogleBusinessRecommendations,
  provideInternalLinkingRecommendations,
  provideLandingPages,
  provideLocalKeywords,
  provideNapConsistencyRecommendations,
  provideSeoMetadata,
  provideServicePages,
  provideStructuredDataRecommendations,
} from "./seo-providers.js";
import type {
  IntegrationHandshake,
  LandingPageAsset,
  LocalSeoInput,
  LocalSeoReport,
  LocalSeoWorkerCatalog,
  SeoContext,
  SeoSession,
  ServiceOfferFixture,
} from "./types.js";

let seoSeq = 0;

export function resetSeoSequenceForTesting() {
  seoSeq = 0;
}

export function nextSeoId() {
  seoSeq += 1;
  return `lseo-rpt-${String(seoSeq).padStart(4, "0")}`;
}

function isFullOffer(
  offer: ServiceOfferReport | ServiceOfferFixture | null,
): offer is ServiceOfferReport {
  return (
    !!offer &&
    "serviceCatalogue" in offer &&
    Array.isArray((offer as ServiceOfferReport).serviceCatalogue) &&
    "consumableByQ704" in offer &&
    "pricingRecommendations" in offer
  );
}

export class SeoBuilder {
  buildCatalog(
    config: LocalSeoWorkerConfiguration,
    reports: LocalSeoReport[],
    sessions: SeoSession[],
    integrations: IntegrationHandshake[],
  ): LocalSeoWorkerCatalog {
    const landingPages = sessions.flatMap((s) => s.landingPages);
    return {
      reportVersion: LOCAL_SEO_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      sessions: sessions.map((s) => ({ ...s })),
      landingPages: landingPages.map((p) => ({ ...p })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: LSEO_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPublishWebsites: true,
      neverPurchaseBacklinks: true,
      neverManipulateSearchRankings: true,
      neverModifyLiveGoogleBusinessProfilesAutomatically: true,
      neverFabricateSeoPerformanceResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ708OrLater: true,
      consumableByQ708: true,
    };
  }

  createSession(
    input: LocalSeoInput,
    offer: ServiceOfferReport | ServiceOfferFixture | null,
    offerSource: SeoSession["offerSource"],
  ): SeoSession {
    const now = new Date().toISOString();
    const seoId = input.reportId?.trim() || input.seoId?.trim() || nextSeoId();
    const sourceOfferReportId = resolveSourceOfferId(offer, input, offerSource);
    const full = isFullOffer(offer) ? offer : null;
    const fixture = !full && offer ? (offer as ServiceOfferFixture) : null;
    const serviceCategory = String(
      input.serviceCategory ??
        full?.serviceCatalogue?.[0]?.category ??
        fixture?.serviceCategory ??
        "local_service",
    );
    const targetCity = String(input.targetCity ?? fixture?.targetCity ?? "unspecified");
    const targetServiceArea = String(
      input.targetServiceArea ??
        fixture?.targetServiceArea ??
        full?.servicePackages?.[0]?.geographicCoverage ??
        "unspecified",
    );
    const targetLocation = String(
      input.targetLocation ?? fixture?.targetLocation ?? `${targetServiceArea}, ${targetCity}`,
    );
    const businessName = String(
      input.businessName ??
        fixture?.businessName ??
        fixture?.napHints?.name ??
        `${serviceCategory} local business`,
    );
    return {
      seoId,
      createdAt: now,
      updatedAt: now,
      status: "open",
      input: { ...input },
      sourceOfferReportId,
      serviceOffer: offer,
      offerSource,
      businessName,
      targetLocation,
      serviceCategory,
      landingPages: [],
      googleBusinessRecommendations: [],
      localKeywords: [],
      metadata: [],
      structuredDataRecommendations: [],
      citationRecommendations: [],
      internalLinkingRecommendations: [],
      napConsistencyRecommendations: [],
      faqAssets: [],
      completeness: null,
    };
  }

  buildContext(
    session: SeoSession,
    _config: LocalSeoWorkerConfiguration,
  ): SeoContext {
    const offer = session.serviceOffer;
    const full = isFullOffer(offer) ? offer : null;
    const fixture = !full && offer ? (offer as ServiceOfferFixture) : null;
    const serviceCategory = String(
      session.input.serviceCategory ??
        full?.serviceCatalogue?.[0]?.category ??
        fixture?.serviceCategory ??
        "local_service",
    );
    const targetCountry = String(
      session.input.targetCountry ?? fixture?.targetCountry ?? "unspecified",
    );
    const targetCity = String(
      session.input.targetCity ?? fixture?.targetCity ?? "unspecified",
    );
    const targetServiceArea = String(
      session.input.targetServiceArea ??
        fixture?.targetServiceArea ??
        full?.servicePackages?.[0]?.geographicCoverage ??
        "unspecified",
    );
    const targetLocation = String(
      session.input.targetLocation ??
        fixture?.targetLocation ??
        `${targetServiceArea}, ${targetCity}`,
    );
    const businessName = String(
      session.input.businessName ??
        fixture?.businessName ??
        fixture?.napHints?.name ??
        `${serviceCategory} local business`,
    );
    const services = resolveServices(full, fixture, serviceCategory);
    const packages = resolvePackages(full, fixture);
    const napHints = {
      name: fixture?.napHints?.name ?? businessName,
      address:
        fixture?.napHints?.address ??
        `${targetServiceArea}, ${targetCity}, ${targetCountry}`,
      phone: fixture?.napHints?.phone,
      website: fixture?.napHints?.website,
    };
    return {
      seoId: session.seoId,
      businessProjectId: String(
        session.input.businessProjectId ??
          full?.businessProjectId ??
          fixture?.businessProjectId ??
          "unspecified",
      ),
      sourceOfferReportId: session.sourceOfferReportId ?? "unknown",
      businessName,
      serviceCategory,
      targetCountry,
      targetCity,
      targetServiceArea,
      targetLocation,
      services,
      packages,
      napHints,
      customerFacingLanguage: [...(fixture?.customerFacingLanguage ?? [])],
      serviceOffer: offer,
      now: new Date().toISOString(),
    };
  }

  applyGbp(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    const ctx = this.buildContext(session, config);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "building",
      businessName: ctx.businessName,
      targetLocation: ctx.targetLocation,
      serviceCategory: ctx.serviceCategory,
      googleBusinessRecommendations: provideGoogleBusinessRecommendations(ctx),
      napConsistencyRecommendations: provideNapConsistencyRecommendations(ctx),
    };
  }

  applyLandingPages(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    const ctx = this.buildContext(session, config);
    const landing = provideLandingPages(ctx);
    const others = session.landingPages.filter((p) => p.pageType !== "landing");
    return this.withPages(session, ctx, [...landing, ...others]);
  }

  applyServicePages(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    const ctx = this.buildContext(session, config);
    const servicePages = provideServicePages(ctx);
    const others = session.landingPages.filter((p) => p.pageType !== "service");
    return this.withPages(session, ctx, [...others, ...servicePages]);
  }

  applyCityAreaPages(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    const ctx = this.buildContext(session, config);
    const cityArea = provideCityAreaPages(ctx);
    const others = session.landingPages.filter(
      (p) => p.pageType !== "city" && p.pageType !== "area",
    );
    return this.withPages(session, ctx, [...others, ...cityArea]);
  }

  applyKeywords(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    const ctx = this.buildContext(session, config);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "building",
      localKeywords: provideLocalKeywords(ctx),
    };
  }

  applyMetadata(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    let working = session;
    if (!working.landingPages.length) {
      working = this.applyLandingPages(working, config);
      working = this.applyServicePages(working, config);
      working = this.applyCityAreaPages(working, config);
    }
    const ctx = this.buildContext(working, config);
    return {
      ...working,
      updatedAt: ctx.now,
      status: "building",
      metadata: provideSeoMetadata(ctx, working.landingPages),
    };
  }

  applyStructuredData(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    let working = session;
    if (!working.landingPages.length) {
      working = this.applyLandingPages(working, config);
      working = this.applyServicePages(working, config);
      working = this.applyCityAreaPages(working, config);
    }
    const ctx = this.buildContext(working, config);
    return {
      ...working,
      updatedAt: ctx.now,
      status: "building",
      structuredDataRecommendations: provideStructuredDataRecommendations(
        ctx,
        working.landingPages,
      ),
    };
  }

  applyCitations(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    const ctx = this.buildContext(session, config);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "building",
      citationRecommendations: provideCitationRecommendations(ctx),
    };
  }

  applyInternalLinks(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    let working = session;
    if (!working.landingPages.length) {
      working = this.applyLandingPages(working, config);
      working = this.applyServicePages(working, config);
      working = this.applyCityAreaPages(working, config);
    }
    return {
      ...working,
      updatedAt: new Date().toISOString(),
      status: "building",
      internalLinkingRecommendations: provideInternalLinkingRecommendations(
        working.landingPages,
      ),
    };
  }

  applyCompleteness(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    let working = this.ensureCoreAssets(session, config);
    const completeness = provideCompletenessEvaluation(working);
    return {
      ...working,
      updatedAt: new Date().toISOString(),
      status: "building",
      completeness,
    };
  }

  assembleReport(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): LocalSeoReport {
    let working = this.ensureCoreAssets(session, config);
    if (!working.completeness) {
      working = this.applyCompleteness(working, config);
    }
    const ctx = this.buildContext(working, config);
    const faqAssets = working.landingPages.flatMap((p) =>
      p.faq.map((f) => ({ ...f, pageId: p.pageId })),
    );
    const outstandingIssues = [
      ...(working.completeness?.outstandingGaps ?? []).map(
        (g) => `Missing SEO asset checklist item: ${g}`,
      ),
      "Live ranking/traffic results are never claimed by Local SEO Worker",
      "Websites are never published; GBP is never modified live by this worker",
    ];
    const confidenceScore = computeConfidence(working);

    return lockReport({
      reportId: working.seoId,
      timestamp: ctx.now,
      businessProjectId: ctx.businessProjectId,
      targetLocation: ctx.targetLocation,
      serviceCategory: ctx.serviceCategory,
      landingPagesGenerated: working.landingPages,
      googleBusinessRecommendations: working.googleBusinessRecommendations,
      localKeywords: working.localKeywords,
      metadata: working.metadata,
      structuredDataRecommendations: working.structuredDataRecommendations,
      citationRecommendations: working.citationRecommendations,
      seoCompletenessStatus: working.completeness!,
      auditStatus:
        working.completeness!.status === "complete"
          ? "ready_for_q708"
          : "assets_prepared",
      outstandingIssues,
      confidenceScore,
      metadataVersion: LSEO_METADATA_VERSION,
      reportVersion: LOCAL_SEO_REPORT_VERSION,
      workerId: config.workerId || LOCAL_SEO_WORKER_IDENTITY.workerId,
      internalLinkingRecommendations: working.internalLinkingRecommendations,
      napConsistencyRecommendations: working.napConsistencyRecommendations,
      faqAssets,
      sourceOfferReportId: ctx.sourceOfferReportId,
      consumableByQ708: true,
      neverPublishWebsites: true,
      neverPurchaseBacklinks: true,
      neverManipulateSearchRankings: true,
      neverModifyLiveGoogleBusinessProfilesAutomatically: true,
      neverModifyUnrelatedPlatformComponents: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricateSeoPerformanceResults: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ708OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q7-07:local_seo:${working.seoId}`,
        `q7-07:source_offer:${ctx.sourceOfferReportId}`,
        `q7-07:business_project:${ctx.businessProjectId}`,
        `q7-07:service_category:${ctx.serviceCategory}`,
        `q7-07:location:${ctx.targetLocation}`,
        `q7-03:consumable_contract:SOW-Q704-v1`,
      ],
    });
  }

  private ensureCoreAssets(
    session: SeoSession,
    config: LocalSeoWorkerConfiguration,
  ): SeoSession {
    let working = { ...session };
    if (!working.googleBusinessRecommendations.length) {
      working = this.applyGbp(working, config);
    }
    if (!working.landingPages.some((p) => p.pageType === "landing")) {
      working = this.applyLandingPages(working, config);
    }
    if (!working.landingPages.some((p) => p.pageType === "service")) {
      working = this.applyServicePages(working, config);
    }
    if (
      !working.landingPages.some((p) => p.pageType === "city") ||
      !working.landingPages.some((p) => p.pageType === "area")
    ) {
      working = this.applyCityAreaPages(working, config);
    }
    if (!working.localKeywords.length) working = this.applyKeywords(working, config);
    if (!working.metadata.length) working = this.applyMetadata(working, config);
    if (!working.structuredDataRecommendations.length) {
      working = this.applyStructuredData(working, config);
    }
    if (!working.citationRecommendations.length) {
      working = this.applyCitations(working, config);
    }
    if (!working.internalLinkingRecommendations.length) {
      working = this.applyInternalLinks(working, config);
    }
    if (!working.napConsistencyRecommendations.length) {
      const ctx = this.buildContext(working, config);
      working = {
        ...working,
        napConsistencyRecommendations: provideNapConsistencyRecommendations(ctx),
      };
    }
    return working;
  }

  private withPages(
    session: SeoSession,
    ctx: SeoContext,
    pages: LandingPageAsset[],
  ): SeoSession {
    const faqAssets = pages.flatMap((p) =>
      p.faq.map((f) => ({ ...f, pageId: p.pageId })),
    );
    return {
      ...session,
      updatedAt: ctx.now,
      status: "building",
      businessName: ctx.businessName,
      targetLocation: ctx.targetLocation,
      serviceCategory: ctx.serviceCategory,
      landingPages: pages,
      faqAssets,
      internalLinkingRecommendations: provideInternalLinkingRecommendations(pages),
    };
  }
}

function resolveSourceOfferId(
  offer: ServiceOfferReport | ServiceOfferFixture | null,
  input: LocalSeoInput,
  offerSource: SeoSession["offerSource"],
): string | null {
  if (isFullOffer(offer)) return offer.reportId;
  if (offer && "reportId" in offer && offer.reportId) return offer.reportId;
  if (input.offerReportId?.trim()) return input.offerReportId.trim();
  if (offerSource === "fixtureServiceOffer") return "fixture-service-offer";
  return null;
}

function resolveServices(
  full: ServiceOfferReport | null,
  fixture: ServiceOfferFixture | null,
  fallbackCategory: string,
): string[] {
  if (full?.serviceCatalogue?.length) {
    return full.serviceCatalogue.map((s) => s.name).filter(Boolean);
  }
  if (fixture?.serviceCatalogue?.length) {
    return fixture.serviceCatalogue.map((s) => s.name).filter(Boolean);
  }
  return [`${fallbackCategory} standard`, `${fallbackCategory} deep`];
}

function resolvePackages(
  full: ServiceOfferReport | null,
  fixture: ServiceOfferFixture | null,
): string[] {
  if (full?.servicePackages?.length) {
    return full.servicePackages.map((p) => p.name).filter(Boolean);
  }
  if (fixture?.servicePackages?.length) {
    return fixture.servicePackages.map((p) => p.name).filter(Boolean);
  }
  return ["basic", "premium", "recurring"];
}

function computeConfidence(session: SeoSession): number {
  const completeness = session.completeness;
  if (!session.serviceOffer) return 0.05;
  const assetScore = completeness?.score ?? 0.4;
  const offerBoost = session.offerSource === "none" ? 0 : 0.15;
  return Math.max(0.05, Math.min(0.95, Number((assetScore * 0.85 + offerBoost).toFixed(2))));
}

function lockReport(report: LocalSeoReport): LocalSeoReport {
  return {
    ...report,
    consumableByQ708: true,
    neverPublishWebsites: true,
    neverPurchaseBacklinks: true,
    neverManipulateSearchRankings: true,
    neverModifyLiveGoogleBusinessProfilesAutomatically: true,
    neverModifyUnrelatedPlatformComponents: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateSeoPerformanceResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ708OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
