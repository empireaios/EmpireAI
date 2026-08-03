import type { LeadGenerationWorkerConfiguration } from "./configuration.js";
import {
  nextFormId,
  nextFunnelId,
  nextLeadId,
  nextMetricsId,
  nextScoreId,
  nextStageId,
  normalizeConversionStage,
  normalizeLeadSource,
  normalizeQualification,
  scoreBand,
} from "./funnel-builder.js";
import type {
  CapturedLead,
  ConversionStageRecord,
  EnquiryForm,
  FunnelMetrics,
  LeadFunnel,
  LeadGenInput,
  LeadScore,
} from "./types.js";

export function provideLeadFunnel(
  input: LeadGenInput,
  config: LeadGenerationWorkerConfiguration,
  ctx: {
    businessProjectId: string;
    businessName: string;
    serviceCategory: string;
    targetLocation: string;
    landingPageRefs: string[];
    sourceSeoReportId: string | null;
  },
): LeadFunnel {
  const now = new Date().toISOString();
  return {
    funnelId: input.funnelId?.trim() || nextFunnelId(),
    businessProjectId: ctx.businessProjectId,
    name:
      input.funnelName?.trim() ||
      `${ctx.businessName} — ${ctx.serviceCategory} lead funnel`,
    serviceCategory: ctx.serviceCategory,
    targetLocation: ctx.targetLocation,
    landingPageRefs: [...ctx.landingPageRefs],
    formIds: [],
    leadSourcePrimary: normalizeLeadSource(input.leadSource ?? "landing_page"),
    status: "active",
    sourceSeoReportId: ctx.sourceSeoReportId,
    createdAt: now,
    updatedAt: now,
    notes: [
      `Worker ${config.workerId} created structural lead funnel`,
      "Never executes advertising campaigns; never fabricates conversions",
    ],
  };
}

export function provideEnquiryForm(
  input: LeadGenInput,
  funnel: LeadFunnel,
): EnquiryForm {
  const now = new Date().toISOString();
  const leadSource = normalizeLeadSource(
    input.leadSource ?? funnel.leadSourcePrimary,
  );
  return {
    formId: input.formId?.trim() || nextFormId(),
    funnelId: funnel.funnelId,
    businessProjectId: funnel.businessProjectId,
    name:
      input.formName?.trim() ||
      `${funnel.serviceCategory} enquiry form — ${funnel.targetLocation}`,
    leadSource,
    fields: [
      {
        fieldId: "fld-name",
        name: "contactName",
        label: "Full name",
        fieldType: "text",
        required: true,
      },
      {
        fieldId: "fld-phone",
        name: "contactPhone",
        label: "Phone",
        fieldType: "phone",
        required: true,
      },
      {
        fieldId: "fld-email",
        name: "contactEmail",
        label: "Email",
        fieldType: "email",
        required: false,
      },
      {
        fieldId: "fld-interest",
        name: "interest",
        label: "Service interest",
        fieldType: "text",
        required: true,
      },
      {
        fieldId: "fld-message",
        name: "message",
        label: "Message",
        fieldType: "textarea",
        required: false,
      },
    ],
    submitLabel: "Request quote",
    landingPageRef: input.landingPageRef ?? funnel.landingPageRefs[0] ?? null,
    createdAt: now,
    updatedAt: now,
    neverExposeProhibitedPersonalData: true,
  };
}

export function provideCapturedLead(
  input: LeadGenInput,
  funnel: LeadFunnel,
  form: EnquiryForm | null,
): CapturedLead {
  const now = new Date().toISOString();
  const submission = { ...(input.formSubmission ?? {}) };
  const contactName =
    input.contactName?.trim() ||
    submission.contactName ||
    submission.name ||
    "Unknown enquirer";
  const contactPhone =
    input.contactPhone?.trim() || submission.contactPhone || submission.phone || null;
  const contactEmail =
    input.contactEmail?.trim() || submission.contactEmail || submission.email || null;
  const interest =
    input.interest?.trim() ||
    submission.interest ||
    funnel.serviceCategory;
  const message =
    input.message?.trim() || submission.message || submission.notes || "";
  if (!submission.contactName) submission.contactName = contactName;
  if (contactPhone && !submission.contactPhone) submission.contactPhone = contactPhone;
  if (contactEmail && !submission.contactEmail) submission.contactEmail = contactEmail;
  if (!submission.interest) submission.interest = interest;

  return {
    leadId: input.leadId?.trim() || nextLeadId(),
    funnelId: funnel.funnelId,
    formId: form?.formId ?? input.formId?.trim() ?? null,
    businessProjectId: funnel.businessProjectId,
    leadSource: normalizeLeadSource(
      input.leadSource ?? form?.leadSource ?? funnel.leadSourcePrimary,
    ),
    qualificationStatus: normalizeQualification(input.qualificationStatus ?? "new"),
    conversionStage: normalizeConversionStage(input.conversionStage ?? "enquiry"),
    contactName,
    contactChannel:
      input.contactChannel?.trim() ||
      (normalizeLeadSource(input.leadSource) === "whatsapp" ? "whatsapp" : "form"),
    contactEmail,
    contactPhone,
    interest,
    message,
    capturedAt: now,
    updatedAt: now,
    score: null,
    crmLeadRef: null,
    bookingRef: null,
    crmIntegrationStatus: "not_routed",
    bookingIntegrationStatus: "not_routed",
    formSubmission: submission,
    sourceSeoReportId: funnel.sourceSeoReportId,
    tags: [...(input.tags ?? [])],
    fabricated: false,
  };
}

export function provideLeadScore(lead: CapturedLead): LeadScore {
  const factors: string[] = [];
  let value = 0.2;
  if (lead.contactName && lead.contactName !== "Unknown enquirer") {
    value += 0.15;
    factors.push("named_contact");
  }
  if (lead.contactPhone) {
    value += 0.2;
    factors.push("phone_present");
  }
  if (lead.contactEmail) {
    value += 0.1;
    factors.push("email_present");
  }
  if (lead.interest) {
    value += 0.15;
    factors.push("interest_stated");
  }
  if (lead.message && lead.message.length > 10) {
    value += 0.1;
    factors.push("message_detail");
  }
  if (
    lead.qualificationStatus === "qualified" ||
    lead.qualificationStatus === "routed_to_crm" ||
    lead.qualificationStatus === "routed_to_booking"
  ) {
    value += 0.15;
    factors.push("qualification_positive");
  }
  if (lead.qualificationStatus === "disqualified") {
    value = Math.min(value, 0.25);
    factors.push("disqualified_cap");
  }
  value = Math.min(1, Math.round(value * 100) / 100);
  return {
    scoreId: nextScoreId(),
    leadId: lead.leadId,
    value,
    band: scoreBand(value),
    factors,
    scoredAt: new Date().toISOString(),
    fabricated: false,
  };
}

export function provideConversionStage(
  lead: CapturedLead,
  stage: string | null | undefined,
  notes = "",
): ConversionStageRecord {
  return {
    stageId: nextStageId(),
    leadId: lead.leadId,
    funnelId: lead.funnelId,
    stage: normalizeConversionStage(stage ?? lead.conversionStage),
    recordedAt: new Date().toISOString(),
    source: "observed",
    fabricated: false,
    notes,
  };
}

/**
 * Funnel metrics derived strictly from observed captured leads in store.
 * Empty store / no leads for funnel => zeros and unknown averages — never invent conversions.
 */
export function provideFunnelMetrics(
  funnel: LeadFunnel,
  observedLeads: CapturedLead[],
): FunnelMetrics {
  const leadsBySource: Record<string, number> = {};
  const leadsByQualification: Record<string, number> = {};
  const leadsByConversionStage: Record<string, number> = {};
  let scoreSum = 0;
  let scoreCount = 0;
  let qualifiedCount = 0;
  let routedToCrmCount = 0;
  let routedToBookingCount = 0;

  for (const lead of observedLeads) {
    leadsBySource[lead.leadSource] = (leadsBySource[lead.leadSource] ?? 0) + 1;
    leadsByQualification[lead.qualificationStatus] =
      (leadsByQualification[lead.qualificationStatus] ?? 0) + 1;
    leadsByConversionStage[lead.conversionStage] =
      (leadsByConversionStage[lead.conversionStage] ?? 0) + 1;
    if (
      lead.qualificationStatus === "qualified" ||
      lead.qualificationStatus === "routed_to_crm" ||
      lead.qualificationStatus === "routed_to_booking"
    ) {
      qualifiedCount += 1;
    }
    if (lead.crmIntegrationStatus === "routed") routedToCrmCount += 1;
    if (lead.bookingIntegrationStatus === "routed") routedToBookingCount += 1;
    if (lead.score) {
      scoreSum += lead.score.value;
      scoreCount += 1;
    }
  }

  const total = observedLeads.length;
  const averageScore =
    scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) / 100 : null;
  const confidenceScore =
    total === 0 ? 0 : Math.min(1, Math.round((0.4 + total * 0.1) * 100) / 100);

  return {
    metricsId: nextMetricsId(),
    funnelId: funnel.funnelId,
    businessProjectId: funnel.businessProjectId,
    generatedAt: new Date().toISOString(),
    totalCapturedLeads: total,
    leadsBySource,
    leadsByQualification,
    leadsByConversionStage,
    qualifiedCount,
    routedToCrmCount,
    routedToBookingCount,
    averageScore,
    confidenceScore,
    derivedFromObservedCapturesOnly: true,
    neverFabricated: true,
    notes:
      total === 0
        ? [
            "No observed captures in store — metrics are zero/unknown; never fabricated",
          ]
        : [
            `Derived from ${total} observed capture(s) only`,
            "Never invents conversions, ad performance, or unobserved funnel drop-offs",
          ],
  };
}

export function autoQualify(lead: CapturedLead): CapturedLead["qualificationStatus"] {
  if (!lead.contactName || lead.contactName === "Unknown enquirer") {
    return "disqualified";
  }
  if (!lead.contactPhone && !lead.contactEmail) {
    return "disqualified";
  }
  if (!lead.interest) {
    return "contacted";
  }
  return "qualified";
}
