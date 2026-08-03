import type { LocalMarketResearchReport } from "../local-market-research-worker/types.js";
import type { ServiceOfferWorkerConfiguration } from "./configuration.js";
import {
  provideFulfilmentRequirements,
  provideGuarantees,
  provideOperationalAssumptions,
  provideOutstandingQuestions,
  providePackageExclusions,
  providePackageInclusions,
  providePricingRecommendations,
  provideRisks,
  provideServiceCatalogue,
  provideServicePackages,
} from "./offer-providers.js";
import {
  PACKAGE_TYPES,
  SERVICE_OFFER_REPORT_VERSION,
  SERVICE_OFFER_WORKER_IDENTITY,
  SOW_METADATA_VERSION,
} from "./paths.js";
import type {
  IntegrationHandshake,
  OfferContext,
  OfferSession,
  PackageType,
  ResearchFixture,
  ServiceOfferInput,
  ServiceOfferReport,
  ServiceOfferWorkerCatalog,
} from "./types.js";

let offerSeq = 0;

export function resetOfferSequenceForTesting() {
  offerSeq = 0;
}

export function nextOfferId() {
  offerSeq += 1;
  return `sow-rpt-${String(offerSeq).padStart(4, "0")}`;
}

function isFullReport(
  research: LocalMarketResearchReport | ResearchFixture | null,
): research is LocalMarketResearchReport {
  return (
    !!research &&
    "competitorProfiles" in research &&
    Array.isArray((research as LocalMarketResearchReport).competitorProfiles) &&
    "demandFindings" in research &&
    "consumableByQ703" in research
  );
}

export function hasPricingEvidence(
  research: LocalMarketResearchReport | ResearchFixture | null,
): boolean {
  if (!research) return false;
  if (isFullReport(research)) {
    const pricing = research.pricingFindings;
    return (
      !!pricing &&
      pricing.typicalPriceRange?.evidenceClass !== "unknown" &&
      String(pricing.typicalPriceRange?.value ?? "").trim() !== "" &&
      !String(pricing.typicalPriceRange.value).toLowerCase().includes("unknown")
    );
  }
  const pricing = research.pricingFindings;
  if (!pricing?.typicalPriceRange?.value) return false;
  return pricing.typicalPriceRange.evidenceClass !== "unknown";
}

export class OfferBuilder {
  buildCatalog(
    config: ServiceOfferWorkerConfiguration,
    reports: ServiceOfferReport[],
    sessions: OfferSession[],
    integrations: IntegrationHandshake[],
  ): ServiceOfferWorkerCatalog {
    return {
      reportVersion: SERVICE_OFFER_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      sessions: sessions.map((s) => ({ ...s })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: SOW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverBuildBookingSystems: true,
      neverBuildCrm: true,
      neverExecuteCustomerJobs: true,
      neverLaunchBusiness: true,
      neverFabricatePricingEvidence: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ704OrLater: true,
      consumableByQ704: true,
    };
  }

  createSession(
    input: ServiceOfferInput,
    research: LocalMarketResearchReport | ResearchFixture | null,
    researchSource: OfferSession["researchSource"],
  ): OfferSession {
    const now = new Date().toISOString();
    const offerId = input.reportId?.trim() || input.offerId?.trim() || nextOfferId();
    const sourceResearchId = resolveSourceResearchId(research, input, researchSource);
    return {
      offerId,
      createdAt: now,
      updatedAt: now,
      status: "open",
      input: { ...input },
      sourceResearchId,
      marketResearch: research,
      researchSource,
      serviceCatalogue: [],
      servicePackages: [],
      pricingRecommendations: [],
      packageInclusions: [],
      packageExclusions: [],
      guarantees: [],
      fulfilmentRequirements: [],
      operationalAssumptions: [],
      risks: [],
      outstandingQuestions: [],
      pricingEvidenceAvailable: hasPricingEvidence(research),
    };
  }

  buildContext(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): OfferContext {
    const research = session.marketResearch;
    const full = isFullReport(research) ? research : null;
    const fixture = !full && research ? (research as ResearchFixture) : null;
    const packageTypes = resolvePackageTypes(session.input.packageTypes, config.packageTypes);
    const pricingFindings = full
      ? full.pricingFindings
      : fixture?.pricingFindings ?? null;

    return {
      offerId: session.offerId,
      businessProjectId: String(
        session.input.businessProjectId ??
          full?.businessProjectId ??
          fixture?.businessProjectId ??
          "unspecified",
      ),
      sourceResearchId: session.sourceResearchId ?? "unknown",
      serviceCategory: String(
        session.input.serviceCategory ??
          full?.serviceCategory ??
          fixture?.serviceCategory ??
          "local_service",
      ),
      targetCountry: String(
        session.input.targetCountry ?? full?.targetCountry ?? fixture?.targetCountry ?? "unspecified",
      ),
      targetCity: String(
        session.input.targetCity ?? full?.targetCity ?? fixture?.targetCity ?? "unspecified",
      ),
      targetServiceArea: String(
        session.input.targetServiceArea ??
          full?.targetServiceArea ??
          fixture?.targetServiceArea ??
          "unspecified",
      ),
      customerSegments: resolveSegments(session, full, fixture),
      currency: String(
        session.input.currency ??
          (pricingFindings && "currency" in pricingFindings
            ? pricingFindings.currency
            : undefined) ??
          "USD",
      ),
      packageTypes,
      marketResearch: research,
      pricingFindings,
      pricingEvidenceAvailable: session.pricingEvidenceAvailable,
      now: new Date().toISOString(),
    };
  }

  applyCatalogue(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): OfferSession {
    const ctx = this.buildContext(session, config);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "building",
      serviceCatalogue: provideServiceCatalogue(ctx),
    };
  }

  applyPackages(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): OfferSession {
    const ctx = this.buildContext(session, config);
    const catalogue =
      session.serviceCatalogue.length > 0
        ? session.serviceCatalogue
        : provideServiceCatalogue(ctx);
    const packages = provideServicePackages(ctx, catalogue);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "building",
      serviceCatalogue: catalogue,
      servicePackages: packages,
      packageInclusions: providePackageInclusions(packages),
      packageExclusions: providePackageExclusions(packages),
    };
  }

  applyPricing(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): OfferSession {
    let working = session;
    if (!working.servicePackages.length) {
      working = this.applyPackages(working, config);
    }
    const ctx = this.buildContext(working, config);
    return {
      ...working,
      updatedAt: ctx.now,
      status: "building",
      pricingRecommendations: providePricingRecommendations(ctx, working.servicePackages),
    };
  }

  applyInclusions(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): OfferSession {
    let working = session;
    if (!working.servicePackages.length) {
      working = this.applyPackages(working, config);
    }
    return {
      ...working,
      updatedAt: new Date().toISOString(),
      status: "building",
      packageInclusions: providePackageInclusions(working.servicePackages),
    };
  }

  applyExclusions(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): OfferSession {
    let working = session;
    if (!working.servicePackages.length) {
      working = this.applyPackages(working, config);
    }
    return {
      ...working,
      updatedAt: new Date().toISOString(),
      status: "building",
      packageExclusions: providePackageExclusions(working.servicePackages),
    };
  }

  applyGuarantees(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): OfferSession {
    let working = session;
    if (!working.servicePackages.length) {
      working = this.applyPackages(working, config);
    }
    const ctx = this.buildContext(working, config);
    return {
      ...working,
      updatedAt: ctx.now,
      status: "building",
      guarantees: provideGuarantees(ctx, working.servicePackages),
    };
  }

  applyFulfilment(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): OfferSession {
    let working = session;
    if (!working.servicePackages.length) {
      working = this.applyPackages(working, config);
    }
    const ctx = this.buildContext(working, config);
    return {
      ...working,
      updatedAt: ctx.now,
      status: "building",
      fulfilmentRequirements: provideFulfilmentRequirements(ctx, working.servicePackages),
    };
  }

  assembleReport(
    session: OfferSession,
    config: ServiceOfferWorkerConfiguration,
  ): ServiceOfferReport {
    let working = { ...session };
    if (!working.serviceCatalogue.length) working = this.applyCatalogue(working, config);
    if (!working.servicePackages.length) working = this.applyPackages(working, config);
    if (!working.pricingRecommendations.length) working = this.applyPricing(working, config);
    if (!working.packageInclusions.length) working = this.applyInclusions(working, config);
    if (!working.packageExclusions.length) working = this.applyExclusions(working, config);
    if (!working.guarantees.length) working = this.applyGuarantees(working, config);
    if (!working.fulfilmentRequirements.length) working = this.applyFulfilment(working, config);

    const ctx = this.buildContext(working, config);
    const operationalAssumptions = provideOperationalAssumptions(ctx);
    const risks = provideRisks(ctx);
    const outstandingQuestions = provideOutstandingQuestions(ctx);
    const confidenceScore = computeConfidenceFromResearchDensity(working);
    const evidenceAssumptionNotes = [
      working.pricingEvidenceAvailable
        ? "Pricing recommendations anchored to Q7-02 pricingFindings (estimated from observed ranges)"
        : "Pricing evidence incomplete — recommended prices marked unknown/assumption; never fabricated",
      "Guarantees and fulfilment requirements include structural assumptions where research is silent",
      "Evidence vs assumption distinguished via evidenceClass on package and pricing fields",
    ];

    return lockReport({
      reportId: working.offerId,
      timestamp: ctx.now,
      businessProjectId: ctx.businessProjectId,
      serviceCatalogue: working.serviceCatalogue,
      servicePackages: working.servicePackages,
      pricingRecommendations: working.pricingRecommendations,
      packageInclusions: working.packageInclusions,
      packageExclusions: working.packageExclusions,
      guarantees: working.guarantees,
      fulfilmentRequirements: working.fulfilmentRequirements,
      operationalAssumptions,
      risks,
      outstandingQuestions,
      confidenceScore,
      executiveSummary: buildExecutiveSummary(working, confidenceScore, ctx),
      metadataVersion: SOW_METADATA_VERSION,
      reportVersion: SERVICE_OFFER_REPORT_VERSION,
      workerId: config.workerId || SERVICE_OFFER_WORKER_IDENTITY.workerId,
      sourceResearchId: ctx.sourceResearchId,
      evidenceAssumptionNotes,
      consumableByQ704: true,
      neverBuildBookingSystems: true,
      neverBuildCrm: true,
      neverExecuteCustomerJobs: true,
      neverLaunchBusiness: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricatePricingEvidence: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ704OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q7-03:service_offer:${working.offerId}`,
        `q7-03:source_research:${ctx.sourceResearchId}`,
        `q7-03:business_project:${ctx.businessProjectId}`,
        `q7-03:service_category:${ctx.serviceCategory}`,
        `q7-03:location:${ctx.targetCountry}/${ctx.targetCity}/${ctx.targetServiceArea}`,
        `q7-02:consumable_contract:LMRW-Q703-v1`,
      ],
    });
  }
}

function resolveSourceResearchId(
  research: LocalMarketResearchReport | ResearchFixture | null,
  input: ServiceOfferInput,
  researchSource: OfferSession["researchSource"],
): string | null {
  if (isFullReport(research)) return research.researchId;
  if (research && "researchId" in research && research.researchId) return research.researchId;
  if (input.researchId?.trim()) return input.researchId.trim();
  if (researchSource === "fixtureMarketResearch") return "fixture-market-research";
  return null;
}

function resolveSegments(
  session: OfferSession,
  full: LocalMarketResearchReport | null,
  fixture: ResearchFixture | null,
): string[] {
  const fromInput = session.input.customerSegments ?? [];
  const fromFull = full?.customerSegments ?? [];
  const fromFixture = fixture?.customerSegments ?? [];
  return [...new Set([...fromInput, ...fromFull, ...fromFixture].map(String).filter(Boolean))];
}

function resolvePackageTypes(
  inputTypes: ServiceOfferInput["packageTypes"],
  configTypes: PackageType[],
): PackageType[] {
  const allowed = new Set<string>(PACKAGE_TYPES);
  const fromInput = (inputTypes ?? [])
    .map((t) => String(t))
    .filter((t): t is PackageType => allowed.has(t));
  if (fromInput.length) return fromInput;
  const fromConfig = configTypes.filter((t) => allowed.has(t));
  return fromConfig.length
    ? fromConfig.filter((t) => t !== "unknown" && t !== "optional_addon" && t !== "enterprise")
    : (["basic", "premium", "recurring", "emergency"] as PackageType[]);
}

function computeConfidenceFromResearchDensity(session: OfferSession): number {
  let observed = 0;
  let slots = 0;

  slots += 1;
  if (session.marketResearch) observed += 1;

  slots += 1;
  if (session.pricingEvidenceAvailable) observed += 1;

  slots += 1;
  if (session.serviceCatalogue.length > 0) observed += 1;

  slots += 1;
  if (session.servicePackages.length > 0) observed += 1;

  slots += 1;
  if (
    session.pricingRecommendations.some(
      (p) => p.evidenceClass !== "unknown" && p.researchTypicalRange,
    )
  ) {
    observed += 1;
  }

  slots += 1;
  if (session.guarantees.length > 0) observed += 1;

  slots += 1;
  if (session.fulfilmentRequirements.length > 0) observed += 1;

  const research = session.marketResearch;
  if (isFullReport(research)) {
    slots += 1;
    if (research.competitorProfiles.length > 0) observed += 1;
    slots += 1;
    if (research.demandFindings?.demandIndicators?.length) observed += 1;
    slots += 1;
    if (research.opportunityFindings?.length) observed += 1;
  } else if (research) {
    slots += 1;
    if (research.competitors?.length) observed += 1;
    slots += 1;
    if (research.demand?.demandIndicators?.length) observed += 1;
    slots += 1;
    if (research.opportunities?.length) observed += 1;
  } else {
    slots += 3;
  }

  if (!session.marketResearch) return 0.05;
  const ratio = slots === 0 ? 0 : observed / slots;
  return Math.max(0.05, Math.min(0.95, Number(ratio.toFixed(2))));
}

function buildExecutiveSummary(
  session: OfferSession,
  confidence: number,
  ctx: OfferContext,
): string {
  return [
    `Service offer package for ${ctx.serviceCategory} in ${ctx.targetCity}/${ctx.targetServiceArea}.`,
    `Catalogue=${session.serviceCatalogue.length}; packages=${session.servicePackages.length}; pricingRecommendations=${session.pricingRecommendations.length}; confidence=${confidence}.`,
    session.pricingEvidenceAvailable
      ? "Pricing recommendations reference Q7-02 pricing findings."
      : "Pricing evidence incomplete — unknowns/assumptions recorded honestly.",
    "Structural signals only — no booking systems, CRM, job execution, or business launch.",
  ].join(" ");
}

function lockReport(report: ServiceOfferReport): ServiceOfferReport {
  return {
    ...report,
    consumableByQ704: true,
    neverBuildBookingSystems: true,
    neverBuildCrm: true,
    neverExecuteCustomerJobs: true,
    neverLaunchBusiness: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricatePricingEvidence: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ704OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
