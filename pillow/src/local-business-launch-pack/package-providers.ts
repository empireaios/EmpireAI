import { nextCollectionId, nextVerificationId } from "./package-builder.js";
import { CRITICAL_DELIVERABLE_ITEMS, DELIVERABLE_ITEMS } from "./paths.js";
import type {
  ApprovalRecommendation,
  BookingArtefactSummary,
  BookingFixture,
  CollectedArtefact,
  CollectedFactoryOutputs,
  CrmArtefactSummary,
  CrmFixture,
  DeliverableItem,
  DeliverableVerification,
  DeliverableVerificationItem,
  LaunchPackageSection,
  LbfcArtefactSummary,
  LbfcFixture,
  LeadGenerationArtefactSummary,
  LeadGenerationFixture,
  LocalSeoArtefactSummary,
  LocalSeoFixture,
  MarketResearchArtefactSummary,
  MarketResearchFixture,
  OperationsArtefactSummary,
  OperationsFixture,
  ReadinessAssessment,
  ReadinessStatus,
  ServiceOfferArtefactSummary,
  ServiceOfferFixture,
  WhatsAppArtefactSummary,
  WhatsAppFixture,
} from "./types.js";

function pickString(...vals: Array<unknown>): string | null {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function pickNumber(...vals: Array<unknown>): number | null {
  for (const v of vals) if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function pickCount(...vals: Array<unknown>): number {
  for (const v of vals) {
    if (Array.isArray(v)) return v.length;
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}

function emptyArtefact<T>(): CollectedArtefact<T> {
  return { present: false, source: "none", summary: null, evidenceRefs: [], reportId: null, confidenceScore: null };
}

function matchLatestByProject<T extends Record<string, unknown>>(
  list: T[] | undefined,
  businessProjectId: string,
): T | null {
  const matches = (list ?? []).filter((r) => r.businessProjectId === businessProjectId);
  return matches.length ? matches[matches.length - 1]! : null;
}

/* ------------------------------------------------------------------------ */
/* Per-artefact collection — fixture takes precedence, then live worker      */
/* report, then genuinely absent. Never invents a missing report.           */
/* ------------------------------------------------------------------------ */

export function provideLbfcArtefact(
  fixture: LbfcFixture | null | undefined,
  liveProjects: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
  businessNameHint: string | null,
): CollectedArtefact<LbfcArtefactSummary> {
  if (fixture) {
    const bpId = pickString(fixture.businessProjectId, businessProjectId);
    const name = pickString(fixture.businessName, businessNameHint);
    if (bpId && name) {
      return {
        present: true,
        source: "fixture",
        summary: {
          businessProjectId: bpId,
          businessName: name,
          businessCategory: pickString(fixture.businessCategory),
          currentLifecycleStage: pickString(fixture.currentLifecycleStage),
          approvalStatus: pickString(fixture.approvalStatus),
          launchReadiness: pickString(fixture.launchReadiness),
        },
        evidenceRefs: [`fixtureLbfc:${bpId}`],
        reportId: null,
        confidenceScore: pickNumber(fixture.confidenceScore),
      };
    }
  }
  const match = matchLatestByProject(liveProjects, businessProjectId);
  if (match) {
    const name = pickString(match.businessName, businessNameHint);
    if (name) {
      return {
        present: true,
        source: "worker",
        summary: {
          businessProjectId,
          businessName: name,
          businessCategory: pickString(match.businessCategory),
          currentLifecycleStage: pickString(match.currentLifecycleStage),
          approvalStatus: pickString(match.approvalStatus),
          launchReadiness: pickString(match.launchReadiness),
        },
        evidenceRefs: [`localBusinessFactoryCore:${businessProjectId}`],
        reportId: pickString(match.factoryMissionId),
        confidenceScore: pickNumber(match.confidenceScore),
      };
    }
  }
  return emptyArtefact();
}

export function provideMarketResearchArtefact(
  fixture: MarketResearchFixture | null | undefined,
  liveReports: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
): CollectedArtefact<MarketResearchArtefactSummary> {
  if (fixture) {
    const reportId = pickString(fixture.reportId) ?? `fixture-market-research-${businessProjectId}`;
    return {
      present: true,
      source: "fixture",
      summary: {
        reportId,
        targetCity: pickString(fixture.targetCity),
        targetServiceArea: pickString(fixture.targetServiceArea),
        serviceCategory: pickString(fixture.serviceCategory),
        executiveSummary: pickString(fixture.executiveSummary),
        opportunityCount: pickCount(fixture.opportunityFindingsCount),
        confidenceScore: pickNumber(fixture.confidenceScore),
      },
      evidenceRefs: [`fixtureMarketResearch:${reportId}`],
      reportId,
      confidenceScore: pickNumber(fixture.confidenceScore),
    };
  }
  const match = matchLatestByProject(liveReports, businessProjectId);
  if (match) {
    const reportId = pickString(match.researchId, match.reportId) ?? `market-research-${businessProjectId}`;
    return {
      present: true,
      source: "worker",
      summary: {
        reportId,
        targetCity: pickString(match.targetCity),
        targetServiceArea: pickString(match.targetServiceArea),
        serviceCategory: pickString(match.serviceCategory),
        executiveSummary: pickString(match.executiveSummary),
        opportunityCount: pickCount(match.opportunityFindings),
        confidenceScore: pickNumber(match.confidenceScore),
      },
      evidenceRefs: [`localMarketResearchWorker:${reportId}`],
      reportId,
      confidenceScore: pickNumber(match.confidenceScore),
    };
  }
  return emptyArtefact();
}

export function provideServiceOfferArtefact(
  fixture: ServiceOfferFixture | null | undefined,
  liveReports: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
): CollectedArtefact<ServiceOfferArtefactSummary> {
  if (fixture) {
    const reportId = pickString(fixture.reportId) ?? `fixture-service-offer-${businessProjectId}`;
    return {
      present: true,
      source: "fixture",
      summary: {
        reportId,
        packageCount: pickCount(fixture.servicePackagesCount),
        pricingRecommendationCount: pickCount(fixture.pricingRecommendationsCount),
        currency: pickString(fixture.currency),
        executiveSummary: pickString(fixture.executiveSummary),
        confidenceScore: pickNumber(fixture.confidenceScore),
      },
      evidenceRefs: [`fixtureServiceOffer:${reportId}`],
      reportId,
      confidenceScore: pickNumber(fixture.confidenceScore),
    };
  }
  const match = matchLatestByProject(liveReports, businessProjectId);
  if (match) {
    const reportId = pickString(match.reportId) ?? `service-offer-${businessProjectId}`;
    return {
      present: true,
      source: "worker",
      summary: {
        reportId,
        packageCount: pickCount(match.servicePackages),
        pricingRecommendationCount: pickCount(match.pricingRecommendations),
        currency: pickString((match.pricingRecommendations as Array<{ currency?: string }> | undefined)?.[0]?.currency),
        executiveSummary: pickString(match.executiveSummary),
        confidenceScore: pickNumber(match.confidenceScore),
      },
      evidenceRefs: [`serviceOfferWorker:${reportId}`],
      reportId,
      confidenceScore: pickNumber(match.confidenceScore),
    };
  }
  return emptyArtefact();
}

export function provideBookingArtefact(
  fixture: BookingFixture | null | undefined,
  liveReports: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
): CollectedArtefact<BookingArtefactSummary> {
  if (fixture) {
    const reportId = pickString(fixture.reportId);
    const bookingId = pickString(fixture.bookingId) ?? `fixture-booking-${businessProjectId}`;
    const bookingStatus = pickString(fixture.bookingStatus);
    return {
      present: true,
      source: "fixture",
      summary: {
        reportId,
        bookingId,
        bookingStatus,
        confirmed: (bookingStatus ?? "").toLowerCase() === "confirmed",
        confidenceScore: pickNumber(fixture.confidenceScore),
      },
      evidenceRefs: [`fixtureBooking:${bookingId}`],
      reportId,
      confidenceScore: pickNumber(fixture.confidenceScore),
    };
  }
  const match = matchLatestByProject(liveReports, businessProjectId);
  if (match) {
    const reportId = pickString(match.reportId);
    const bookingId = pickString(match.bookingId) ?? `booking-${businessProjectId}`;
    const bookingStatus = pickString(match.bookingStatus);
    return {
      present: true,
      source: "worker",
      summary: {
        reportId,
        bookingId,
        bookingStatus,
        confirmed: (bookingStatus ?? "").toLowerCase() === "confirmed",
        confidenceScore: pickNumber(match.confidenceScore),
      },
      evidenceRefs: [`bookingWorker:${bookingId}`],
      reportId,
      confidenceScore: pickNumber(match.confidenceScore),
    };
  }
  return emptyArtefact();
}

export function provideCrmArtefact(
  fixture: CrmFixture | null | undefined,
  liveReports: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
): CollectedArtefact<CrmArtefactSummary> {
  if (fixture) {
    const reportId = pickString(fixture.reportId) ?? `fixture-crm-${businessProjectId}`;
    return {
      present: true,
      source: "fixture",
      summary: {
        reportId,
        customerId: pickString(fixture.customerId),
        leadStatus: pickString(fixture.leadStatus),
        customerLifecycleStage: pickString(fixture.customerLifecycleStage),
        confidenceScore: pickNumber(fixture.confidenceScore),
      },
      evidenceRefs: [`fixtureCrm:${reportId}`],
      reportId,
      confidenceScore: pickNumber(fixture.confidenceScore),
    };
  }
  const match = matchLatestByProject(liveReports, businessProjectId);
  if (match) {
    const reportId = pickString(match.reportId) ?? `crm-${businessProjectId}`;
    return {
      present: true,
      source: "worker",
      summary: {
        reportId,
        customerId: pickString(match.customerId),
        leadStatus: pickString(match.leadStatus),
        customerLifecycleStage: pickString(match.customerLifecycleStage),
        confidenceScore: pickNumber(match.confidenceScore),
      },
      evidenceRefs: [`crmWorker:${reportId}`],
      reportId,
      confidenceScore: pickNumber(match.confidenceScore),
    };
  }
  return emptyArtefact();
}

export function provideWhatsAppArtefact(
  fixture: WhatsAppFixture | null | undefined,
  liveReports: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
): CollectedArtefact<WhatsAppArtefactSummary> {
  if (fixture) {
    const reportId = pickString(fixture.reportId) ?? `fixture-whatsapp-${businessProjectId}`;
    return {
      present: true,
      source: "fixture",
      summary: {
        reportId,
        conversationId: pickString(fixture.conversationId),
        conversationStatus: pickString(fixture.conversationStatus),
        confidenceScore: pickNumber(fixture.confidenceScore),
      },
      evidenceRefs: [`fixtureWhatsApp:${reportId}`],
      reportId,
      confidenceScore: pickNumber(fixture.confidenceScore),
    };
  }
  const match = matchLatestByProject(liveReports, businessProjectId);
  if (match) {
    const reportId = pickString(match.reportId) ?? `whatsapp-${businessProjectId}`;
    return {
      present: true,
      source: "worker",
      summary: {
        reportId,
        conversationId: pickString(match.conversationId),
        conversationStatus: pickString(match.conversationStatus),
        confidenceScore: pickNumber(match.confidenceScore),
      },
      evidenceRefs: [`whatsAppWorker:${reportId}`],
      reportId,
      confidenceScore: pickNumber(match.confidenceScore),
    };
  }
  return emptyArtefact();
}

export function provideLocalSeoArtefact(
  fixture: LocalSeoFixture | null | undefined,
  liveReports: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
): CollectedArtefact<LocalSeoArtefactSummary> {
  if (fixture) {
    const reportId = pickString(fixture.reportId) ?? `fixture-local-seo-${businessProjectId}`;
    return {
      present: true,
      source: "fixture",
      summary: {
        reportId,
        landingPageCount: pickCount(fixture.landingPagesGeneratedCount),
        confidenceScore: pickNumber(fixture.confidenceScore),
      },
      evidenceRefs: [`fixtureLocalSeo:${reportId}`],
      reportId,
      confidenceScore: pickNumber(fixture.confidenceScore),
    };
  }
  const match = matchLatestByProject(liveReports, businessProjectId);
  if (match) {
    const reportId = pickString(match.reportId) ?? `local-seo-${businessProjectId}`;
    return {
      present: true,
      source: "worker",
      summary: {
        reportId,
        landingPageCount: pickCount(match.landingPagesGenerated),
        confidenceScore: pickNumber(match.confidenceScore),
      },
      evidenceRefs: [`localSeoWorker:${reportId}`],
      reportId,
      confidenceScore: pickNumber(match.confidenceScore),
    };
  }
  return emptyArtefact();
}

export function provideLeadGenerationArtefact(
  fixture: LeadGenerationFixture | null | undefined,
  liveReports: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
): CollectedArtefact<LeadGenerationArtefactSummary> {
  if (fixture) {
    const reportId = pickString(fixture.reportId) ?? `fixture-lead-generation-${businessProjectId}`;
    return {
      present: true,
      source: "fixture",
      summary: {
        reportId,
        funnelId: pickString(fixture.funnelId),
        confidenceScore: pickNumber(fixture.confidenceScore),
      },
      evidenceRefs: [`fixtureLeadGeneration:${reportId}`],
      reportId,
      confidenceScore: pickNumber(fixture.confidenceScore),
    };
  }
  const match = matchLatestByProject(liveReports, businessProjectId);
  if (match) {
    const reportId = pickString(match.reportId) ?? `lead-generation-${businessProjectId}`;
    return {
      present: true,
      source: "worker",
      summary: {
        reportId,
        funnelId: pickString(match.funnelId),
        confidenceScore: pickNumber(match.confidenceScore),
      },
      evidenceRefs: [`leadGenerationWorker:${reportId}`],
      reportId,
      confidenceScore: pickNumber(match.confidenceScore),
    };
  }
  return emptyArtefact();
}

export function provideOperationsArtefact(
  fixture: OperationsFixture | null | undefined,
  liveReports: Array<Record<string, unknown>> | undefined,
  businessProjectId: string,
): CollectedArtefact<OperationsArtefactSummary> {
  if (fixture) {
    const reportId = pickString(fixture.reportId) ?? `fixture-operations-${businessProjectId}`;
    return {
      present: true,
      source: "fixture",
      summary: {
        reportId,
        workflowId: pickString(fixture.workflowId),
        operationalStagesCount: pickCount(fixture.operationalStagesCount),
        confidenceScore: pickNumber(fixture.confidenceScore),
      },
      evidenceRefs: [`fixtureOperations:${reportId}`],
      reportId,
      confidenceScore: pickNumber(fixture.confidenceScore),
    };
  }
  const match = matchLatestByProject(liveReports, businessProjectId);
  if (match) {
    const reportId = pickString(match.reportId) ?? `operations-${businessProjectId}`;
    return {
      present: true,
      source: "worker",
      summary: {
        reportId,
        workflowId: pickString(match.workflowId),
        operationalStagesCount: pickCount(match.operationalStages),
        confidenceScore: pickNumber(match.confidenceScore),
      },
      evidenceRefs: [`operationsWorker:${reportId}`],
      reportId,
      confidenceScore: pickNumber(match.confidenceScore),
    };
  }
  return emptyArtefact();
}

/* ------------------------------------------------------------------------ */
/* Collection assembly.                                                      */
/* ------------------------------------------------------------------------ */

export function provideCollectedFactoryOutputs(params: {
  businessProjectId: string;
  lbfc: CollectedArtefact<LbfcArtefactSummary>;
  marketResearch: CollectedArtefact<MarketResearchArtefactSummary>;
  serviceOffer: CollectedArtefact<ServiceOfferArtefactSummary>;
  booking: CollectedArtefact<BookingArtefactSummary>;
  crm: CollectedArtefact<CrmArtefactSummary>;
  whatsApp: CollectedArtefact<WhatsAppArtefactSummary>;
  localSeo: CollectedArtefact<LocalSeoArtefactSummary>;
  leadGeneration: CollectedArtefact<LeadGenerationArtefactSummary>;
  operations: CollectedArtefact<OperationsArtefactSummary>;
}): CollectedFactoryOutputs {
  const presenceByItem: Record<DeliverableItem, boolean> = {
    business_identity: params.lbfc.present,
    market_research: params.marketResearch.present,
    service_offer: params.serviceOffer.present,
    booking_readiness: params.booking.present,
    crm_readiness: params.crm.present,
    whatsapp_readiness: params.whatsApp.present,
    local_seo: params.localSeo.present,
    lead_generation: params.leadGeneration.present,
    operations: params.operations.present,
  };
  return {
    collectionId: nextCollectionId(),
    businessProjectId: params.businessProjectId,
    collectedAt: new Date().toISOString(),
    lbfc: params.lbfc,
    marketResearch: params.marketResearch,
    serviceOffer: params.serviceOffer,
    booking: params.booking,
    crm: params.crm,
    whatsApp: params.whatsApp,
    localSeo: params.localSeo,
    leadGeneration: params.leadGeneration,
    operations: params.operations,
    sourcesPresent: DELIVERABLE_ITEMS.filter((item) => presenceByItem[item]),
    sourcesMissing: DELIVERABLE_ITEMS.filter((item) => !presenceByItem[item]),
    neverInventMissingReports: true,
  };
}

/* ------------------------------------------------------------------------ */
/* Deliverable verification.                                                 */
/* ------------------------------------------------------------------------ */

const DELIVERABLE_LABELS: Record<DeliverableItem, string> = {
  business_identity: "Business identity (Q7-01 LBFC project record)",
  market_research: "Market research report (Q7-02)",
  service_offer: "Service offer & pricing catalogue (Q7-03)",
  booking_readiness: "Booking readiness (Q7-04)",
  crm_readiness: "CRM readiness (Q7-05)",
  whatsapp_readiness: "WhatsApp communication readiness (Q7-06)",
  local_seo: "Local SEO assets (Q7-07)",
  lead_generation: "Lead generation funnel (Q7-08)",
  operations: "Operations workflow design (Q7-09)",
};

function buildVerificationItem(
  item: DeliverableItem,
  collection: CollectedFactoryOutputs,
): DeliverableVerificationItem {
  const critical = (CRITICAL_DELIVERABLE_ITEMS as readonly string[]).includes(item);
  const label = DELIVERABLE_LABELS[item];
  const artefactByItem: Record<DeliverableItem, CollectedArtefact<unknown>> = {
    business_identity: collection.lbfc,
    market_research: collection.marketResearch,
    service_offer: collection.serviceOffer,
    booking_readiness: collection.booking,
    crm_readiness: collection.crm,
    whatsapp_readiness: collection.whatsApp,
    local_seo: collection.localSeo,
    lead_generation: collection.leadGeneration,
    operations: collection.operations,
  };
  const artefact = artefactByItem[item];
  return {
    item,
    label,
    present: artefact.present,
    required: true,
    critical,
    evidenceRefs: [...artefact.evidenceRefs],
    notes: artefact.present
      ? `${label} verified from ${artefact.source === "fixture" ? "supplied fixture" : "injected worker report"} evidence.`
      : `${label} not found — no fixture or injected worker report supplied for this business project.`,
  };
}

export function provideDeliverableVerification(collection: CollectedFactoryOutputs): DeliverableVerification {
  const items = DELIVERABLE_ITEMS.map((item) => buildVerificationItem(item, collection));
  const missingItems = items.filter((i) => !i.present).map((i) => i.item);
  const criticalItemsMissing = items.filter((i) => !i.present && i.critical).map((i) => i.item);
  return {
    verificationId: nextVerificationId(),
    businessProjectId: collection.businessProjectId,
    verifiedAt: new Date().toISOString(),
    items,
    requiredCount: items.length,
    presentCount: items.filter((i) => i.present).length,
    allRequiredPresent: missingItems.length === 0,
    missingItems,
    criticalItemsMissing,
  };
}

/* ------------------------------------------------------------------------ */
/* Section builders — evidence-only, extensible.                             */
/* ------------------------------------------------------------------------ */

function evidencedSection(
  summary: string,
  evidenceRefs: string[],
  data: Record<string, unknown>,
): LaunchPackageSection {
  return { status: "evidenced", summary, evidenceRefs, data };
}

function missingSection(summary: string): LaunchPackageSection {
  return { status: "evidence_missing", summary, evidenceRefs: [], data: {} };
}

/** Exported for callers (e.g. the manager) that need a bare evidence-missing section, such as when no businessProjectId could be resolved at all. */
export function provideUnresolvedSection(message: string): LaunchPackageSection {
  return missingSection(message);
}

export function provideBusinessOverviewSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.lbfc.present || !collection.lbfc.summary) {
    return missingSection(
      `No LBFC project identity collected for ${collection.businessProjectId} — business overview not assessed.`,
    );
  }
  const s = collection.lbfc.summary;
  return evidencedSection(
    `${s.businessName} (${s.businessCategory ?? "uncategorized"}) — lifecycle stage: ${s.currentLifecycleStage ?? "unknown"}; approval status: ${s.approvalStatus ?? "unknown"}.`,
    collection.lbfc.evidenceRefs,
    { ...s },
  );
}

export function provideTargetMarketSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.marketResearch.present || !collection.marketResearch.summary) {
    return missingSection(
      `No market research report collected for ${collection.businessProjectId} — target market not assessed.`,
    );
  }
  const s = collection.marketResearch.summary;
  return evidencedSection(
    `Target market: ${s.targetCity ?? "unknown city"} / ${s.targetServiceArea ?? "unknown area"} for ${s.serviceCategory ?? "the service category"}; ${s.opportunityCount} opportunity finding(s) identified in research evidence.`,
    collection.marketResearch.evidenceRefs,
    { ...s },
  );
}

export function provideServiceCatalogueSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.serviceOffer.present || !collection.serviceOffer.summary) {
    return missingSection(
      `No service offer report collected for ${collection.businessProjectId} — service catalogue not assessed.`,
    );
  }
  const s = collection.serviceOffer.summary;
  return evidencedSection(
    `${s.packageCount} service package(s) defined in the Q7-03 service offer evidence.`,
    collection.serviceOffer.evidenceRefs,
    { ...s },
  );
}

export function providePricingSummarySection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.serviceOffer.present || !collection.serviceOffer.summary) {
    return missingSection(
      `No pricing evidence collected for ${collection.businessProjectId} — pricing summary not assessed.`,
    );
  }
  const s = collection.serviceOffer.summary;
  return evidencedSection(
    `${s.pricingRecommendationCount} pricing recommendation(s) recorded${s.currency ? ` in ${s.currency}` : ""}; figures reflect evidence-classed Q7-03 findings, never final approved pricing.`,
    collection.serviceOffer.evidenceRefs,
    { ...s },
  );
}

export function provideBookingReadinessSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.booking.present || !collection.booking.summary) {
    return missingSection(
      `No booking report or fixture collected for ${collection.businessProjectId} — booking readiness not assessed.`,
    );
  }
  const s = collection.booking.summary;
  return evidencedSection(
    `Booking ${s.bookingId ?? "unknown"} status=${s.bookingStatus ?? "unknown"}; confirmed=${s.confirmed}.`,
    collection.booking.evidenceRefs,
    { ...s },
  );
}

export function provideCrmReadinessSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.crm.present || !collection.crm.summary) {
    return missingSection(
      `No CRM report collected for ${collection.businessProjectId} — CRM readiness not assessed.`,
    );
  }
  const s = collection.crm.summary;
  return evidencedSection(
    `CRM lead status=${s.leadStatus ?? "unknown"}; customer lifecycle stage=${s.customerLifecycleStage ?? "unknown"}.`,
    collection.crm.evidenceRefs,
    { ...s },
  );
}

export function provideWhatsAppReadinessSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.whatsApp.present || !collection.whatsApp.summary) {
    return missingSection(
      `No WhatsApp report collected for ${collection.businessProjectId} — WhatsApp readiness not assessed.`,
    );
  }
  const s = collection.whatsApp.summary;
  return evidencedSection(
    `WhatsApp conversation ${s.conversationId ?? "unknown"} status=${s.conversationStatus ?? "unknown"}.`,
    collection.whatsApp.evidenceRefs,
    { ...s },
  );
}

export function provideLocalSeoReadinessSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.localSeo.present || !collection.localSeo.summary) {
    return missingSection(
      `No local SEO report collected for ${collection.businessProjectId} — local SEO readiness not assessed.`,
    );
  }
  const s = collection.localSeo.summary;
  return evidencedSection(
    `${s.landingPageCount} local SEO landing page asset(s) generated.`,
    collection.localSeo.evidenceRefs,
    { ...s },
  );
}

export function provideLeadGenerationReadinessSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.leadGeneration.present || !collection.leadGeneration.summary) {
    return missingSection(
      `No lead generation report collected for ${collection.businessProjectId} — lead generation readiness not assessed.`,
    );
  }
  const s = collection.leadGeneration.summary;
  return evidencedSection(
    `Lead generation funnel ${s.funnelId ?? "unknown"} evidenced.`,
    collection.leadGeneration.evidenceRefs,
    { ...s },
  );
}

export function provideOperationsReadinessSection(collection: CollectedFactoryOutputs): LaunchPackageSection {
  if (!collection.operations.present || !collection.operations.summary) {
    return missingSection(
      `No operations report collected for ${collection.businessProjectId} — operational readiness not assessed.`,
    );
  }
  const s = collection.operations.summary;
  return evidencedSection(
    `Operations workflow ${s.workflowId ?? "unknown"} defines ${s.operationalStagesCount} operational stage(s).`,
    collection.operations.evidenceRefs,
    { ...s },
  );
}

/* ------------------------------------------------------------------------ */
/* Executive summary, risks, readiness and approval derivation.              */
/* ------------------------------------------------------------------------ */

export function provideExecutiveSummary(
  businessName: string,
  businessProjectId: string,
  verification: DeliverableVerification,
  readinessStatus: ReadinessStatus,
): string {
  if (!businessProjectId) {
    return "Launch pack could not be assembled — no business project could be identified from the supplied evidence.";
  }
  const missingLabel = verification.missingItems.length
    ? ` Missing: ${verification.missingItems.join(", ")}.`
    : " All required Q7-01..Q7-09 deliverables are present.";
  return `Local Business Launch Pack for ${businessName || businessProjectId} (${businessProjectId}): ${verification.presentCount}/${verification.requiredCount} required deliverables verified; readiness=${readinessStatus}.${missingLabel} This pack assembles and verifies launch readiness only — it never launches, deploys, certifies, or approves the business.`;
}

export function provideRisksAndOutstandingIssues(
  collection: CollectedFactoryOutputs,
  verification: DeliverableVerification,
): { risks: string[]; outstandingItems: string[]; assumptions: string[] } {
  const risks: string[] = [];
  const outstandingItems: string[] = [];
  const assumptions: string[] = [
    "Pricing and market figures reflect Q7-02/Q7-03 evidence-classed findings and worker-supplied fixtures — not confirmed final commercial terms.",
    "The Launch Pack assembles and verifies readiness signals only; it never launches, deploys, or certifies the business, and never overrides Pillow, Grand King, or existing certification.",
  ];

  for (const item of verification.items) {
    if (!item.present) {
      outstandingItems.push(`Missing deliverable: ${item.label}.`);
      if (item.critical) {
        risks.push(
          `Critical readiness gap — ${item.label} has not been produced for ${verification.businessProjectId}.`,
        );
      }
    }
  }

  const lowConfidenceThreshold = 0.5;
  const confidenceChecks: Array<[string, number | null]> = [
    ["market research", collection.marketResearch.confidenceScore],
    ["service offer", collection.serviceOffer.confidenceScore],
    ["booking", collection.booking.confidenceScore],
    ["CRM", collection.crm.confidenceScore],
    ["WhatsApp", collection.whatsApp.confidenceScore],
    ["local SEO", collection.localSeo.confidenceScore],
    ["lead generation", collection.leadGeneration.confidenceScore],
    ["operations", collection.operations.confidenceScore],
  ];
  for (const [label, score] of confidenceChecks) {
    if (score !== null && score < lowConfidenceThreshold) {
      risks.push(`Low confidence in ${label} findings (score=${score}).`);
    }
  }

  if (!verification.allRequiredPresent) {
    risks.push(
      `Launch package incomplete — ${verification.missingItems.length}/${verification.requiredCount} required deliverable(s) missing.`,
    );
  }

  return { risks, outstandingItems, assumptions };
}

export function provideReadinessStatus(
  verification: DeliverableVerification,
  boundaryViolation: boolean,
): ReadinessStatus {
  if (boundaryViolation) return "blocked";
  if (!verification.businessProjectId) return "unknown";
  if (verification.allRequiredPresent) return "ready_for_approval";
  if (verification.presentCount === 0) return "not_ready";
  return "partial";
}

export function provideApprovalRecommendation(
  readinessStatus: ReadinessStatus,
  verification: DeliverableVerification,
  boundaryViolation: boolean,
): ApprovalRecommendation {
  if (boundaryViolation) return "do_not_approve";
  if (readinessStatus === "unknown") return "deferred";
  if (verification.criticalItemsMissing.length > 0) return "do_not_approve";
  if (readinessStatus === "ready_for_approval") return "recommend_approval";
  if (readinessStatus === "partial") return "approve_with_conditions";
  return "do_not_approve";
}

export function provideConfidenceScore(verification: DeliverableVerification): number {
  if (verification.requiredCount === 0) return 0;
  return Math.round((verification.presentCount / verification.requiredCount) * 100) / 100;
}

export function provideReadinessAssessment(
  verification: DeliverableVerification,
  readinessStatus: ReadinessStatus,
  confidenceScore: number,
): ReadinessAssessment {
  return {
    assessedAt: new Date().toISOString(),
    businessProjectId: verification.businessProjectId,
    readinessStatus,
    requiredCount: verification.requiredCount,
    presentCount: verification.presentCount,
    missingItems: [...verification.missingItems],
    criticalItemsMissing: [...verification.criticalItemsMissing],
    confidenceScore,
    notes: [
      verification.allRequiredPresent
        ? "All required Q7-01..Q7-09 deliverables verified from collected evidence."
        : `${verification.missingItems.length} required deliverable(s) missing — readiness assessment reflects collected evidence only, never fabricated.`,
    ],
  };
}
