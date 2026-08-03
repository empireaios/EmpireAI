import type { EditorInChiefWorkerConfiguration } from "./configuration.js";

import {

  CONTENT_STANDARD_CATEGORIES,

  ECW_METADATA_VERSION,

  EDITORIAL_REPORT_VERSION,

  EDITORIAL_TONES,

  EDITOR_IN_CHIEF_WORKER_IDENTITY,

} from "./paths.js";

import type {

  ApprovalStatus,

  BrandConsistencyStatus,

  ContentStandard,

  EditorialContext,

  EditorialReport,

  EditorInChiefWorkerCatalog,

  EditorInChiefWorkerInput,

  ExecutiveRecommendation,

  IntegrationHandshake,

  PreservedDecision,

  ReviewOutcome,

  EditorialTone,

} from "./types.js";



/** Pure Editor-in-Chief Worker helpers for Q4-02 — editorial direction only. */

export class EditorialBuilder {

  buildCatalog(

    config: EditorInChiefWorkerConfiguration,

    reports: EditorialReport[],

    integrations: IntegrationHandshake[],

  ): EditorInChiefWorkerCatalog {

    return {

      reportVersion: EDITORIAL_REPORT_VERSION,

      workerId: config.workerId,

      editorialReports: reports.map(cloneReport),

      integrations: integrations.map((i) => ({ ...i })),

      metadataVersion: ECW_METADATA_VERSION,

      executiveAuthority: "pillow",

      neverWriteScripts: true,

      neverCreateThumbnails: true,

      neverAssembleVideos: true,

      neverPublishContent: true,

      neverBypassPillowGovernance: true,

      neverOverridePillow: true,

      neverOverrideGrandKing: true,

    };

  }



  mergeContext(

    existing: EditorialContext,

    input: EditorInChiefWorkerInput,

  ): EditorialContext {

    const tone = this.resolveTone(input.editorialTone ?? existing.editorialTone);

    const reviewOutcome = this.resolveReviewOutcome(

      input.reviewOutcome ?? existing.reviewOutcome,

    );

    const approvalStatus = this.resolveApprovalStatus(

      input.approvalDecision ?? existing.approvalStatus,

    );



    return {

      editorialReportId: input.editorialReportId ?? existing.editorialReportId,

      mediaBusinessId:

        input.mediaBusinessId?.trim() ||

        existing.mediaBusinessId?.trim() ||

        null,

      channelId: input.channelId?.trim() || existing.channelId?.trim() || null,

      channelName: input.channelName?.trim() || existing.channelName?.trim() || null,

      mediaMissionId:

        input.mediaMissionId?.trim() || existing.mediaMissionId?.trim() || null,

      editorialStrategy:

        input.editorialStrategy?.trim() ||

        existing.editorialStrategy?.trim() ||

        null,

      channelIdentity:

        input.channelIdentity?.trim() ||

        existing.channelIdentity?.trim() ||

        null,

      targetAudience:

        input.targetAudience?.trim() || existing.targetAudience?.trim() || null,

      editorialTone: tone,

      qualityStandards:

        input.qualityStandards != null

          ? this.normalizeStandards(input.qualityStandards)

          : existing.qualityStandards,

      contentPriorities:

        input.contentPriorities != null

          ? [...input.contentPriorities]

          : existing.contentPriorities,

      contentReviewNotes:

        input.contentReviewNotes?.trim() ||

        existing.contentReviewNotes?.trim() ||

        null,

      brandSignals:

        input.brandSignals != null

          ? [...input.brandSignals]

          : existing.brandSignals,

      longTermStrategy:

        input.longTermStrategy?.trim() ||

        existing.longTermStrategy?.trim() ||

        null,

      reviewOutcome,

      executiveRecommendations:

        input.executiveRecommendations != null

          ? this.normalizeRecommendations(input.executiveRecommendations)

          : existing.executiveRecommendations,

      approvalStatus,

      brandConsistencyStatus: existing.brandConsistencyStatus,

      preservedDecisions: existing.preservedDecisions ?? [],

      traceabilityRefs: existing.traceabilityRefs ?? [],

    };

  }



  buildReport(

    context: EditorialContext,

    config: EditorInChiefWorkerConfiguration,

  ): EditorialReport {

    editorialSequence += 1;

    const now = new Date().toISOString();

    const editorialReportId =

      context.editorialReportId?.trim() ||

      `ecw-edr-${Date.now()}-${editorialSequence}`;



    const mediaBusinessId =

      context.mediaBusinessId?.trim() || `mbiz-ecw-${editorialSequence}`;

    const channelId = context.channelId?.trim() || `chn-ecw-${editorialSequence}`;

    const channelIdentity =

      context.channelIdentity?.trim() ||

      context.channelName?.trim() ||

      `Channel ${channelId}`;

    const editorialStrategy =

      context.editorialStrategy?.trim() ||

      "Establish authoritative editorial direction aligned with media mission goals";

    const targetAudience =

      context.targetAudience?.trim() ||

      "Primary audience aligned with channel identity and media business mission";

    const editorialTone =

      context.editorialTone ?? this.resolveTone(config.defaultEditorialTone);

    const qualityStandards =

      context.qualityStandards?.length

        ? context.qualityStandards

        : this.defaultStandards();

    const contentPriorities =

      context.contentPriorities?.length

        ? context.contentPriorities

        : ["editorial_quality", "brand_consistency", "audience_alignment"];

    const reviewOutcome =

      context.reviewOutcome ??

      this.resolveReviewOutcome(config.defaultReviewOutcome);

    const brandConsistencyStatus =

      context.brandConsistencyStatus ??

      this.assessBrandConsistency(context.brandSignals ?? []);

    const longTermStrategy =

      context.longTermStrategy?.trim() ||

      "Sustain long-term editorial excellence through consistent standards and audience alignment";

    const approvalStatus = context.approvalStatus ?? "pending";

    const executiveRecommendations =

      context.executiveRecommendations?.length

        ? context.executiveRecommendations

        : this.buildRecommendations(context, reviewOutcome, brandConsistencyStatus);

    const preservedDecisions = context.preservedDecisions ?? [];

    const traceabilityRefs = uniqueRefs([

      ...(context.traceabilityRefs ?? []),

      context.mediaMissionId ? `mission:${context.mediaMissionId}` : null,

      `channel:${channelId}`,

      `business:${mediaBusinessId}`,

    ]);



    return {

      editorialReportId,

      timestamp: now,

      mediaBusinessId,

      channelId,

      channelIdentity,

      editorialStrategy,

      targetAudience,

      editorialTone,

      qualityStandards,

      contentPriorities,

      reviewOutcome,

      brandConsistencyStatus,

      longTermStrategy,

      approvalStatus,

      executiveRecommendations,

      mediaMissionId: context.mediaMissionId?.trim() || null,

      workerId: config.workerId,

      reportVersion: EDITORIAL_REPORT_VERSION,

      metadataVersion: ECW_METADATA_VERSION,

      traceabilityRefs,

      preservedDecisions,

      submittedToExecutiveReporting: false,

      executiveReportId: null,

      neverWriteScripts: true,

      neverCreateThumbnails: true,

      neverAssembleVideos: true,

      neverPublishContent: true,

      neverBypassPillowGovernance: true,

      neverOverridePillow: true,

      neverOverrideGrandKing: true,

      neverImplementQ403OrLater: true,

      preserveEditorialConsistency: true,

      preserveChannelIdentity: true,

      preserveAudienceAlignment: true,

      preserveAuditHistory: true,

      structuralSignalOnly: true,

      maskSensitiveValues: true,

    };

  }



  recordDecision(

    context: EditorialContext,

    topic: string,

    decision: string,

  ): EditorialContext {

    const preservedDecisions = [...(context.preservedDecisions ?? [])];

    preservedDecisions.push({

      decisionId: `ecw-dec-${Date.now()}-${preservedDecisions.length + 1}`,

      topic,

      decision,

      recordedAt: new Date().toISOString(),

    });

    return { ...context, preservedDecisions };

  }



  defaultStandards(): ContentStandard[] {

    return CONTENT_STANDARD_CATEGORIES.map((category, index) => ({

      standardId: `ecw-std-${index + 1}`,

      category,

      requirement: `Enforce ${category.replace(/_/g, " ")} across all downstream content`,

      enforced: true,

    }));

  }



  normalizeStandards(

    standards: Array<ContentStandard | string>,

  ): ContentStandard[] {

    return standards.map((standard, index) => {

      if (typeof standard === "string") {

        const category = CONTENT_STANDARD_CATEGORIES[index % CONTENT_STANDARD_CATEGORIES.length]!;

        return {

          standardId: `ecw-std-${index + 1}`,

          category,

          requirement: standard,

          enforced: true,

        };

      }

      return {

        ...standard,

        standardId: standard.standardId || `ecw-std-${index + 1}`,

        enforced: standard.enforced ?? true,

      };

    });

  }



  normalizeRecommendations(

    recommendations: Array<ExecutiveRecommendation | string>,

  ): ExecutiveRecommendation[] {

    return recommendations.map((rec, index) => {

      if (typeof rec === "string") {

        return {

          recommendationId: `ecw-rec-${index + 1}`,

          priority: index === 0 ? "high" : "medium",

          recommendation: rec,

          rationale: "Editorial recommendation for downstream content workers",

        };

      }

      return {

        ...rec,

        recommendationId: rec.recommendationId || `ecw-rec-${index + 1}`,

      };

    });

  }



  buildRecommendations(

    context: EditorialContext,

    reviewOutcome: ReviewOutcome,

    brandConsistencyStatus: BrandConsistencyStatus,

  ): ExecutiveRecommendation[] {

    const recommendations: ExecutiveRecommendation[] = [

      {

        recommendationId: "ecw-rec-direction",

        priority: "high",

        recommendation:

          "Direct downstream content workers using editorial strategy and publishing priorities — do not produce scripts, thumbnails, videos, or publish",

        rationale: "Editor-in-Chief Worker provides direction only under Pillow governance",

      },

    ];

    if (reviewOutcome === "revise") {

      recommendations.push({

        recommendationId: "ecw-rec-revise",

        priority: "high",

        recommendation:

          "Revise content to meet editorial standards before downstream production proceeds",

        rationale: context.contentReviewNotes ?? "Content quality review flagged revision",

      });

    }

    if (brandConsistencyStatus === "minor_drift" || brandConsistencyStatus === "inconsistent") {

      recommendations.push({

        recommendationId: "ecw-rec-brand",

        priority: "medium",

        recommendation:

          "Realign content with channel identity and brand signals before approval",

        rationale: `Brand consistency status: ${brandConsistencyStatus}`,

      });

    }

    return recommendations;

  }



  assessBrandConsistency(brandSignals: string[]): BrandConsistencyStatus {

    if (!brandSignals.length) return "unknown";

    const driftSignals = brandSignals.filter((s) =>

      /drift|inconsistent|off-brand|misaligned/i.test(s),

    );

    if (driftSignals.length >= 2) return "inconsistent";

    if (driftSignals.length === 1) return "minor_drift";

    return "consistent";

  }



  resolveTone(value: EditorialTone | string | null | undefined): EditorialTone {

    const normalized = String(value ?? "authoritative").toLowerCase();

    return (EDITORIAL_TONES as readonly string[]).includes(normalized)

      ? (normalized as EditorialTone)

      : "authoritative";

  }



  resolveReviewOutcome(value: ReviewOutcome | string | null | undefined): ReviewOutcome {

    const normalized = String(value ?? "pending_review").toLowerCase();

    const outcomes = [

      "approved",

      "revise",

      "rejected",

      "pending_review",

      "blocked_boundary",

    ] as const;

    return outcomes.includes(normalized as ReviewOutcome)

      ? (normalized as ReviewOutcome)

      : "pending_review";

  }



  resolveApprovalStatus(value: ApprovalStatus | string | null | undefined): ApprovalStatus {

    const normalized = String(value ?? "pending").toLowerCase();

    const statuses = ["pending", "approved", "rejected", "deferred"] as const;

    return statuses.includes(normalized as ApprovalStatus)

      ? (normalized as ApprovalStatus)

      : "pending";

  }

}



let editorialSequence = 0;



export function resetEditorialSequenceForTesting() {

  editorialSequence = 0;

}



function uniqueRefs(values: Array<string | null | undefined>): string[] {

  return [...new Set(values.filter((v): v is string => Boolean(v?.trim())))];

}



function cloneReport(report: EditorialReport): EditorialReport {

  return {

    ...report,

    qualityStandards: report.qualityStandards.map((s) => ({ ...s })),

    contentPriorities: [...report.contentPriorities],

    executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),

    traceabilityRefs: [...report.traceabilityRefs],

    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),

  };

}



export { EDITOR_IN_CHIEF_WORKER_IDENTITY };


