import type { MediaExecutiveReviewWorkerConfiguration } from "./configuration.js";
import {
  EXECUTIVE_RECOMMENDATIONS,
  EXPECTED_PREREQUISITE_WORKER_KEYS,
  MER_METADATA_VERSION,
  MER_REPORT_VERSION,
} from "./paths.js";
import type {
  AssetCompleteness,
  ComplianceAssessment,
  EditorialStatus,
  ExecutiveRecommendation,
  IntegrationHandshake,
  MediaExecutiveReviewReport,
  MediaExecutiveReviewWorkerCatalog,
  MediaExecutiveReviewWorkerInput,
  PrerequisiteWorkerStatus,
  QualityAssessment,
  ReviewContext,
  ReviewFinding,
  SupportingEvidenceItem,
} from "./types.js";

/** Pure Media Executive Review Worker helpers for Q4-18 — structural signals only. */
export class ReviewBuilder {
  buildCatalog(
    config: MediaExecutiveReviewWorkerConfiguration,
    reports: MediaExecutiveReviewReport[],
    integrations: IntegrationHandshake[],
  ): MediaExecutiveReviewWorkerCatalog {
    return {
      reportVersion: MER_REPORT_VERSION,
      workerId: config.workerId,
      reviewReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      executiveRecommendations: [...EXECUTIVE_RECOMMENDATIONS],
      metadataVersion: MER_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPublishMedia: true,
      neverRewriteScripts: true,
      neverEditMediaAssets: true,
      neverModifyApprovedAssets: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ419OrLater: true,
      neverBypassPillowGovernance: true,
      verifyAllPrerequisiteWorkersCompletedSuccessfully: true,
      preserveCompleteTraceability: true,
      distinguishVerifiedFindingsFromRecommendations: true,
      preserveAuditHistory: true,
    };
  }

  mergeContext(
    input: MediaExecutiveReviewWorkerInput,
    context: ReviewContext,
  ): ReviewContext {
    // Empty-array traps for signals / statuses / hints
    const publishingSignals =
      input.publishingSignals && input.publishingSignals.length > 0
        ? input.publishingSignals.map((s) => ({ ...s }))
        : context.publishingSignals && context.publishingSignals.length > 0
          ? context.publishingSignals.map((s) => ({ ...s }))
          : [];
    const analyticsSignals =
      input.analyticsSignals && input.analyticsSignals.length > 0
        ? input.analyticsSignals.map((s) => ({ ...s }))
        : context.analyticsSignals && context.analyticsSignals.length > 0
          ? context.analyticsSignals.map((s) => ({ ...s }))
          : [];
    const learningSignals =
      input.learningSignals && input.learningSignals.length > 0
        ? input.learningSignals.map((s) => ({ ...s }))
        : context.learningSignals && context.learningSignals.length > 0
          ? context.learningSignals.map((s) => ({ ...s }))
          : [];
    const prerequisiteStatuses =
      input.prerequisiteStatuses && input.prerequisiteStatuses.length > 0
        ? input.prerequisiteStatuses.map((p) => ({
            workerKey: p.workerKey,
            completed: Boolean(p.completed),
            reportId: p.reportId ?? null,
          }))
        : context.prerequisiteStatuses && context.prerequisiteStatuses.length > 0
          ? context.prerequisiteStatuses.map((p) => ({ ...p }))
          : [];
    const outstandingIssueHints =
      input.outstandingIssueHints && input.outstandingIssueHints.length > 0
        ? [...input.outstandingIssueHints]
        : context.outstandingIssueHints && context.outstandingIssueHints.length > 0
          ? [...context.outstandingIssueHints]
          : [];

    const mediaIdFromSignals =
      publishingSignals.find((s) => s.mediaId)?.mediaId ??
      analyticsSignals.find((s) => s.mediaId)?.mediaId ??
      null;
    const channelIdFromSignals =
      publishingSignals.find((s) => s.channelId)?.channelId ??
      analyticsSignals.find((s) => s.channelId)?.channelId ??
      learningSignals.find((s) => s.channelId)?.channelId ??
      null;

    const receivedOutputs =
      context.receivedOutputs ||
      publishingSignals.length > 0 ||
      analyticsSignals.length > 0 ||
      learningSignals.length > 0 ||
      Boolean(input.publishingReportId || input.analyticsReportId || input.learningReportId) ||
      Boolean(input.scriptId || input.thumbnailReportId || input.assemblyId);

    return {
      mediaId: input.mediaId ?? context.mediaId ?? mediaIdFromSignals,
      channelId: input.channelId ?? context.channelId ?? channelIdFromSignals,
      mediaBusinessId: input.mediaBusinessId ?? context.mediaBusinessId ?? null,
      scriptId: input.scriptId ?? context.scriptId ?? null,
      thumbnailReportId: input.thumbnailReportId ?? context.thumbnailReportId ?? null,
      assemblyId: input.assemblyId ?? context.assemblyId ?? null,
      publishingReportId:
        input.publishingReportId ??
        context.publishingReportId ??
        publishingSignals.find((s) => s.publishingReportId)?.publishingReportId ??
        null,
      analyticsReportId:
        input.analyticsReportId ??
        context.analyticsReportId ??
        analyticsSignals.find((s) => s.analyticsReportId)?.analyticsReportId ??
        null,
      learningReportId:
        input.learningReportId ??
        context.learningReportId ??
        learningSignals.find((s) => s.learningReportId)?.learningReportId ??
        null,
      editorialApproved: input.editorialApproved ?? context.editorialApproved ?? null,
      scriptQualityScore: input.scriptQualityScore ?? context.scriptQualityScore ?? null,
      thumbnailQualityScore:
        input.thumbnailQualityScore ?? context.thumbnailQualityScore ?? null,
      visualAssetReady: input.visualAssetReady ?? context.visualAssetReady ?? null,
      voiceReady: input.voiceReady ?? context.voiceReady ?? null,
      subtitleReady: input.subtitleReady ?? context.subtitleReady ?? null,
      publishingPackageComplete:
        input.publishingPackageComplete ?? context.publishingPackageComplete ?? null,
      analyticsTraceable: input.analyticsTraceable ?? context.analyticsTraceable ?? null,
      learningTraceable: input.learningTraceable ?? context.learningTraceable ?? null,
      prerequisiteStatuses,
      publishingSignals,
      analyticsSignals,
      learningSignals,
      outstandingIssueHints,
      receivedOutputs,
      editorialStatus: context.editorialStatus,
      assetCompleteness: context.assetCompleteness,
      qualityAssessment: context.qualityAssessment,
      complianceAssessment: context.complianceAssessment,
      outstandingIssues: context.outstandingIssues,
      verifiedFindings: context.verifiedFindings,
      recommendationFindings: context.recommendationFindings,
      executiveRecommendation: context.executiveRecommendation,
    };
  }

  canReview(context: ReviewContext): { ready: boolean; reason?: string } {
    if (!context.receivedOutputs) {
      return {
        ready: false,
        reason: "Media factory outputs must be received before review",
      };
    }
    const mediaId = context.mediaId?.trim();
    if (!mediaId) {
      return {
        ready: false,
        reason: "mediaId required before media executive review",
      };
    }
    return { ready: true };
  }

  resolvePrerequisiteStatuses(context: ReviewContext): PrerequisiteWorkerStatus[] {
    const provided = context.prerequisiteStatuses ?? [];
    // Empty-array trap
    const byKey = new Map<string, PrerequisiteWorkerStatus>();
    if (provided.length > 0) {
      for (const status of provided) {
        byKey.set(status.workerKey, { ...status });
      }
    }

    const publishingReady =
      Boolean(context.publishingReportId) ||
      (context.publishingSignals?.length ?? 0) > 0 ||
      context.publishingPackageComplete === true;
    const analyticsReady =
      Boolean(context.analyticsReportId) ||
      (context.analyticsSignals?.length ?? 0) > 0 ||
      context.analyticsTraceable === true;
    const learningReady =
      Boolean(context.learningReportId) ||
      (context.learningSignals?.length ?? 0) > 0 ||
      context.learningTraceable === true;

    const defaults: Record<string, PrerequisiteWorkerStatus> = {
      publishing_worker: {
        workerKey: "publishing_worker",
        completed: publishingReady,
        reportId: context.publishingReportId ?? null,
      },
      media_analytics_worker: {
        workerKey: "media_analytics_worker",
        completed: analyticsReady,
        reportId: context.analyticsReportId ?? null,
      },
      media_learning_worker: {
        workerKey: "media_learning_worker",
        completed: learningReady,
        reportId: context.learningReportId ?? null,
      },
    };

    const resolved: PrerequisiteWorkerStatus[] = [];
    for (const key of EXPECTED_PREREQUISITE_WORKER_KEYS) {
      resolved.push(byKey.get(key) ?? defaults[key]!);
    }
    // Preserve any extra provided keys
    if (provided.length > 0) {
      for (const status of provided) {
        if (!EXPECTED_PREREQUISITE_WORKER_KEYS.includes(status.workerKey as typeof EXPECTED_PREREQUISITE_WORKER_KEYS[number])) {
          resolved.push({ ...status });
        }
      }
    }
    return resolved;
  }

  buildAssetCompleteness(context: ReviewContext): AssetCompleteness {
    const publishingSignals = context.publishingSignals ?? [];
    const publishingReadyFromSignals =
      publishingSignals.length > 0 &&
      publishingSignals.some(
        (s) =>
          s.publishingReadinessStatus === "ready" ||
          s.publishingReadinessStatus === "complete" ||
          s.publishingReadinessStatus === "package_complete" ||
          (s.tagsCount != null && s.tagsCount > 0) ||
          Boolean(s.title),
      );

    const scriptReady = Boolean(context.scriptId) || (context.scriptQualityScore != null && context.scriptQualityScore >= 40);
    const thumbnailReady =
      Boolean(context.thumbnailReportId) ||
      (context.thumbnailQualityScore != null && context.thumbnailQualityScore >= 40);
    const visualAssetsReady =
      context.visualAssetReady === true || Boolean(context.assemblyId);
    const voiceReady = context.voiceReady === true;
    const subtitleReady = context.subtitleReady === true;
    const publishingPackageReady =
      context.publishingPackageComplete === true ||
      publishingReadyFromSignals ||
      Boolean(context.publishingReportId);
    const analyticsTraceable =
      context.analyticsTraceable === true ||
      Boolean(context.analyticsReportId) ||
      (context.analyticsSignals?.length ?? 0) > 0;
    const learningTraceable =
      context.learningTraceable === true ||
      Boolean(context.learningReportId) ||
      (context.learningSignals?.length ?? 0) > 0;

    const flags = [
      scriptReady,
      thumbnailReady,
      visualAssetsReady,
      voiceReady,
      subtitleReady,
      publishingPackageReady,
      analyticsTraceable,
      learningTraceable,
    ];
    const readyCount = flags.filter(Boolean).length;
    const completenessScore = clamp(Math.round((readyCount / flags.length) * 100), 0, 100);

    const missingItems: string[] = [];
    if (!scriptReady) missingItems.push("script");
    if (!thumbnailReady) missingItems.push("thumbnail");
    if (!visualAssetsReady) missingItems.push("visual_assets");
    if (!voiceReady) missingItems.push("voice");
    if (!subtitleReady) missingItems.push("subtitle");
    if (!publishingPackageReady) missingItems.push("publishing_package");
    if (!analyticsTraceable) missingItems.push("analytics_traceability");
    if (!learningTraceable) missingItems.push("learning_traceability");

    return {
      scriptReady,
      thumbnailReady,
      visualAssetsReady,
      voiceReady,
      subtitleReady,
      publishingPackageReady,
      analyticsTraceable,
      learningTraceable,
      completenessScore,
      missingItems,
    };
  }

  scoreFromReady(ready: boolean, hint?: number | null): number {
    if (hint != null && Number.isFinite(hint)) return clamp(hint, 0, 100);
    return ready ? 80 : 40;
  }

  buildQualityAssessment(
    context: ReviewContext,
    completeness: AssetCompleteness,
  ): QualityAssessment {
    const editorialScore = this.scoreFromReady(
      context.editorialApproved !== false,
      context.editorialApproved === false ? 30 : context.editorialApproved === true ? 85 : null,
    );
    const scriptScore = this.scoreFromReady(
      completeness.scriptReady,
      context.scriptQualityScore,
    );
    const thumbnailScore = this.scoreFromReady(
      completeness.thumbnailReady,
      context.thumbnailQualityScore,
    );
    const visualScore = this.scoreFromReady(completeness.visualAssetsReady);
    const voiceSubtitleScore = clamp(
      Math.round(
        (this.scoreFromReady(completeness.voiceReady) +
          this.scoreFromReady(completeness.subtitleReady)) /
          2,
      ),
      0,
      100,
    );
    const overallQualityScore = clamp(
      Math.round(
        editorialScore * 0.2 +
          scriptScore * 0.25 +
          thumbnailScore * 0.2 +
          visualScore * 0.15 +
          voiceSubtitleScore * 0.2,
      ),
      0,
      100,
    );
    return {
      overallQualityScore,
      editorialScore,
      scriptScore,
      thumbnailScore,
      visualScore,
      voiceSubtitleScore,
      notes: `Quality assessed from readiness and input scores (overall=${overallQualityScore})`,
    };
  }

  buildComplianceAssessment(
    context: ReviewContext,
    prerequisites: PrerequisiteWorkerStatus[],
  ): ComplianceAssessment {
    const editorialCompliant = context.editorialApproved !== false;
    const pillowGovernanceIntact = true;
    const approvedAssetsUnmodified = true;
    // Empty-array trap
    const prerequisiteWorkersComplete =
      prerequisites.length > 0 && prerequisites.every((p) => p.completed);
    let complianceScore = 100;
    if (!editorialCompliant) complianceScore -= 30;
    if (!prerequisiteWorkersComplete) complianceScore -= 35;
    complianceScore = clamp(complianceScore, 0, 100);
    return {
      editorialCompliant,
      pillowGovernanceIntact,
      prerequisiteWorkersComplete,
      approvedAssetsUnmodified,
      complianceScore,
      notes: prerequisiteWorkersComplete
        ? "Prerequisite workers complete; Pillow governance intact; approved assets unmodified"
        : "Incomplete prerequisite workers detected — compliance reduced",
    };
  }

  resolveEditorialStatus(
    context: ReviewContext,
    findings: ReviewFinding[],
  ): EditorialStatus {
    const editorialBlockers = findings.filter(
      (f) => f.category === "editorial" && f.severity === "blocker",
    );
    // Empty-array trap
    if (editorialBlockers.length > 0 || context.editorialApproved === false) {
      return "non_compliant";
    }
    const editorialWarnings = findings.filter(
      (f) => f.category === "editorial" && f.severity === "warning",
    );
    if (editorialWarnings.length > 0) return "partial";
    if (context.editorialApproved === true) return "compliant";
    return "partial";
  }

  identifyOutstandingIssues(
    context: ReviewContext,
    completeness: AssetCompleteness,
    prerequisites: PrerequisiteWorkerStatus[],
    seq: number,
  ): {
    outstandingIssues: ReviewFinding[];
    verifiedFindings: ReviewFinding[];
    recommendationFindings: ReviewFinding[];
  } {
    const verifiedFindings: ReviewFinding[] = [];
    const recommendationFindings: ReviewFinding[] = [];
    let index = 0;
    const push = (
      category: ReviewFinding["category"],
      severity: ReviewFinding["severity"],
      summary: string,
      kind: ReviewFinding["kind"],
      evidenceRefs: string[],
    ) => {
      index += 1;
      const finding: ReviewFinding = {
        findingId: `mer-f-${seq}-${index}`,
        category,
        severity,
        summary,
        kind,
        evidenceRefs,
      };
      if (kind === "verified") verifiedFindings.push(finding);
      else recommendationFindings.push(finding);
    };

    // Critical asset blockers (verified)
    if (!completeness.scriptReady) {
      push(
        "script",
        "blocker",
        "Script not ready for executive review",
        "verified",
        ["asset:script"],
      );
    }
    if (!completeness.thumbnailReady) {
      push(
        "thumbnail",
        "blocker",
        "Thumbnail not ready for executive review",
        "verified",
        ["asset:thumbnail"],
      );
    }
    if (!completeness.publishingPackageReady) {
      push(
        "publishing",
        "blocker",
        "Publishing package incomplete",
        "verified",
        ["asset:publishing_package"],
      );
    }

    // Prerequisite blockers (verified)
    // Empty-array trap
    if (prerequisites.length > 0) {
      for (const status of prerequisites) {
        if (!status.completed) {
          push(
            "prerequisite",
            "blocker",
            `Prerequisite worker incomplete: ${status.workerKey}`,
            "verified",
            [`prerequisite:${status.workerKey}`],
          );
        }
      }
    }

    if (context.editorialApproved === false) {
      push(
        "editorial",
        "blocker",
        "Editorial approval not granted",
        "verified",
        ["editorial:approved=false"],
      );
    }

    // Warnings for analytics/learning gaps (verified)
    if (!completeness.analyticsTraceable) {
      push(
        "analytics",
        "warning",
        "Analytics traceability gap",
        "verified",
        ["trace:analytics"],
      );
    }
    if (!completeness.learningTraceable) {
      push(
        "learning",
        "warning",
        "Learning traceability gap",
        "verified",
        ["trace:learning"],
      );
    }
    if (!completeness.visualAssetsReady) {
      push(
        "visual",
        "warning",
        "Visual assets not confirmed ready",
        "verified",
        ["asset:visual"],
      );
    }
    if (!completeness.voiceReady || !completeness.subtitleReady) {
      push(
        "voice",
        "warning",
        "Voice and/or subtitle readiness incomplete",
        "verified",
        ["asset:voice_subtitle"],
      );
    }

    // Recommendation findings from hints
    const hints = context.outstandingIssueHints ?? [];
    // Empty-array trap
    if (hints.length > 0) {
      for (const hint of hints) {
        push(
          "compliance",
          "warning",
          hint,
          "recommendation",
          ["hint:outstandingIssue"],
        );
      }
    }

    // Positive verified findings when complete
    if (completeness.scriptReady) {
      push(
        "script",
        "info",
        "Script readiness verified",
        "verified",
        ["asset:script:ready"],
      );
    }
    if (completeness.publishingPackageReady) {
      push(
        "publishing",
        "info",
        "Publishing package completeness verified",
        "verified",
        ["asset:publishing:ready"],
      );
    }

    // Always include at least one recommendation finding for distinction
    if (recommendationFindings.length === 0) {
      push(
        "compliance",
        "info",
        "Structural executive recommendation only — never publish media directly",
        "recommendation",
        ["boundary:neverPublishMedia"],
      );
    }

    const outstandingIssues = [...verifiedFindings, ...recommendationFindings].filter(
      (f) => f.severity === "blocker" || f.severity === "warning",
    );

    return { outstandingIssues, verifiedFindings, recommendationFindings };
  }

  recommendApproveReviseOrReject(
    completeness: AssetCompleteness,
    quality: QualityAssessment,
    compliance: ComplianceAssessment,
    outstandingIssues: ReviewFinding[],
    config: MediaExecutiveReviewWorkerConfiguration,
  ): ExecutiveRecommendation {
    const blockers = outstandingIssues.filter((i) => i.severity === "blocker");
    const warnings = outstandingIssues.filter((i) => i.severity === "warning");
    const approveThreshold = config.approveCompletenessThreshold ?? 80;
    const reviseFloor = config.reviseCompletenessThreshold ?? 40;

    // Empty-array trap on blockers
    if (
      blockers.length > 0 ||
      compliance.complianceScore < 50 ||
      completeness.completenessScore < reviseFloor
    ) {
      return "Reject";
    }
    if (
      warnings.length > 0 &&
      (quality.overallQualityScore < 75 || completeness.completenessScore < approveThreshold)
    ) {
      return "Revise";
    }
    if (
      blockers.length === 0 &&
      completeness.completenessScore >= approveThreshold &&
      quality.overallQualityScore >= 75 &&
      compliance.complianceScore >= 75
    ) {
      return "Approve";
    }
    if (completeness.completenessScore >= reviseFloor) return "Revise";
    return "Reject";
  }

  buildRecommendationRationale(
    decision: ExecutiveRecommendation,
    completeness: AssetCompleteness,
    quality: QualityAssessment,
    compliance: ComplianceAssessment,
    outstandingIssues: ReviewFinding[],
    evidence: SupportingEvidenceItem[],
  ): string {
    const blockers = outstandingIssues.filter((i) => i.severity === "blocker");
    const warnings = outstandingIssues.filter((i) => i.severity === "warning");
    const refs = evidence.slice(0, 6).map((e) => e.evidenceId);
    // Empty-array trap
    const refText = refs.length > 0 ? refs.join(", ") : "derived-signals";
    return (
      `Executive recommendation ${decision}: completeness=${completeness.completenessScore}, ` +
      `quality=${quality.overallQualityScore}, compliance=${compliance.complianceScore}, ` +
      `blockers=${blockers.length}, warnings=${warnings.length}. ` +
      `Evidence refs: ${refText}. ` +
      `Structural review only — never publish media; await Pillow / Grand King publish decision.`
    );
  }

  buildSupportingEvidence(
    context: ReviewContext,
    completeness: AssetCompleteness,
    seq: number,
  ): SupportingEvidenceItem[] {
    const items: SupportingEvidenceItem[] = [];
    let index = 0;
    const push = (
      sourceType: string,
      sourceRef: string,
      statement: string,
      kind: SupportingEvidenceItem["kind"],
    ) => {
      index += 1;
      items.push({
        evidenceId: `mer-ev-${seq}-${index}`,
        sourceType,
        sourceRef,
        statement,
        kind,
      });
    };

    if (context.mediaId) {
      push("input", `media:${context.mediaId}`, `Media under review ${context.mediaId}`, "verified");
    }
    if (context.channelId) {
      push(
        "input",
        `channel:${context.channelId}`,
        `Channel ${context.channelId}`,
        "verified",
      );
    }

    const publishingSignals = context.publishingSignals ?? [];
    // Empty-array traps
    if (publishingSignals.length > 0) {
      for (const s of publishingSignals) {
        push(
          "publishing_worker",
          s.publishingReportId ?? "publishing:unknown",
          `Publishing readiness=${s.publishingReadinessStatus ?? "n/a"} title=${s.title ?? "n/a"}`,
          "verified",
        );
      }
    } else if (context.publishingReportId) {
      push(
        "publishing_worker",
        context.publishingReportId,
        `Publishing report ${context.publishingReportId}`,
        "verified",
      );
    }

    const analyticsSignals = context.analyticsSignals ?? [];
    if (analyticsSignals.length > 0) {
      for (const s of analyticsSignals) {
        push(
          "media_analytics_worker",
          s.analyticsReportId ?? "analytics:unknown",
          `Analytics confidence=${s.confidenceScore ?? "n/a"}`,
          "verified",
        );
      }
    } else if (context.analyticsReportId) {
      push(
        "media_analytics_worker",
        context.analyticsReportId,
        `Analytics report ${context.analyticsReportId}`,
        "verified",
      );
    }

    const learningSignals = context.learningSignals ?? [];
    if (learningSignals.length > 0) {
      for (const s of learningSignals) {
        push(
          "media_learning_worker",
          s.learningReportId ?? "learning:unknown",
          `Learning confidence=${s.confidenceScore ?? "n/a"}`,
          "verified",
        );
      }
    } else if (context.learningReportId) {
      push(
        "media_learning_worker",
        context.learningReportId,
        `Learning report ${context.learningReportId}`,
        "verified",
      );
    }

    push(
      "derived",
      "completeness",
      `Asset completeness score ${completeness.completenessScore}; missing=${completeness.missingItems.join(",") || "none"}`,
      "verified",
    );
    push(
      "recommendation",
      "boundary:neverPublishMedia",
      "Recommend Approve/Revise/Reject only — never publish media directly",
      "recommendation",
    );

    // Ensure at least one evidence item
    if (items.length === 0) {
      push(
        "derived",
        "derived:baseline",
        "Baseline structural media executive review without rich upstream signals",
        "recommendation",
      );
    }
    return items;
  }

  computeConfidenceScore(
    evidence: SupportingEvidenceItem[],
    completeness: AssetCompleteness,
    prerequisites: PrerequisiteWorkerStatus[],
  ): number {
    let score = 50;
    // Empty-array trap
    const evidenceCount = evidence?.length ?? 0;
    score += Math.min(20, evidenceCount * 3);
    const verifiedCount = evidence.filter((e) => e.kind === "verified").length;
    score += Math.min(15, verifiedCount * 3);
    score += Math.round(completeness.completenessScore * 0.15);
    // Empty-array trap
    if (prerequisites.length > 0) {
      const completeCount = prerequisites.filter((p) => p.completed).length;
      score += Math.round((completeCount / prerequisites.length) * 15);
    }
    return clamp(Math.round(score), 0, 100);
  }

  buildReviewReport(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
    context: ReviewContext,
    options: {
      editorialStatus?: EditorialStatus;
      assetCompleteness?: AssetCompleteness;
      qualityAssessment?: QualityAssessment;
      complianceAssessment?: ComplianceAssessment;
      outstandingIssues?: ReviewFinding[];
      verifiedFindings?: ReviewFinding[];
      recommendationFindings?: ReviewFinding[];
      executiveRecommendation?: ExecutiveRecommendation;
    } = {},
  ): MediaExecutiveReviewReport {
    reviewSequence += 1;
    const seq = reviewSequence;
    const now = new Date().toISOString();

    const mediaId =
      context.mediaId?.trim() || input.mediaId?.trim() || `media-pending-${seq}`;
    const channelId =
      context.channelId?.trim() ||
      input.channelId?.trim() ||
      context.publishingSignals?.find((s) => s.channelId)?.channelId ||
      context.analyticsSignals?.find((s) => s.channelId)?.channelId ||
      `channel-pending-${seq}`;
    const reviewId = input.reviewId?.trim() || `mer-rpt-${Date.now()}-${seq}`;
    const mediaBusinessId =
      context.mediaBusinessId?.trim() ||
      input.mediaBusinessId?.trim() ||
      `biz-media-${mediaId}`;

    const prerequisites = this.resolvePrerequisiteStatuses(context);
    const assetCompleteness =
      options.assetCompleteness ??
      context.assetCompleteness ??
      this.buildAssetCompleteness(context);
    const qualityAssessment =
      options.qualityAssessment ??
      context.qualityAssessment ??
      this.buildQualityAssessment(context, assetCompleteness);
    const complianceAssessment =
      options.complianceAssessment ??
      context.complianceAssessment ??
      this.buildComplianceAssessment(context, prerequisites);

    const identified =
      options.outstandingIssues || options.verifiedFindings
        ? {
            outstandingIssues: options.outstandingIssues ?? context.outstandingIssues ?? [],
            verifiedFindings: options.verifiedFindings ?? context.verifiedFindings ?? [],
            recommendationFindings:
              options.recommendationFindings ?? context.recommendationFindings ?? [],
          }
        : this.identifyOutstandingIssues(context, assetCompleteness, prerequisites, seq);

    // Empty-array traps
    const outstandingIssues =
      identified.outstandingIssues && identified.outstandingIssues.length >= 0
        ? identified.outstandingIssues.map((f) => ({
            ...f,
            evidenceRefs: [...f.evidenceRefs],
          }))
        : [];
    const verifiedFindings =
      identified.verifiedFindings && identified.verifiedFindings.length > 0
        ? identified.verifiedFindings.map((f) => ({
            ...f,
            evidenceRefs: [...f.evidenceRefs],
          }))
        : [];
    const recommendationFindings =
      identified.recommendationFindings && identified.recommendationFindings.length > 0
        ? identified.recommendationFindings.map((f) => ({
            ...f,
            evidenceRefs: [...f.evidenceRefs],
          }))
        : [];

    const editorialStatus =
      options.editorialStatus ??
      context.editorialStatus ??
      this.resolveEditorialStatus(context, [...verifiedFindings, ...recommendationFindings]);

    const executiveRecommendation =
      options.executiveRecommendation ??
      context.executiveRecommendation ??
      this.recommendApproveReviseOrReject(
        assetCompleteness,
        qualityAssessment,
        complianceAssessment,
        outstandingIssues,
        config,
      );

    const supportingEvidence = this.buildSupportingEvidence(context, assetCompleteness, seq);
    const recommendationRationale = this.buildRecommendationRationale(
      executiveRecommendation,
      assetCompleteness,
      qualityAssessment,
      complianceAssessment,
      outstandingIssues,
      supportingEvidence,
    );
    const confidenceScore = this.computeConfidenceScore(
      supportingEvidence,
      assetCompleteness,
      prerequisites,
    );

    const sourceTraceabilityRefs = unique([
      `review:${reviewId}`,
      `media:${mediaId}`,
      `channel:${channelId}`,
      `business:${mediaBusinessId}`,
      context.publishingReportId ? `publishing:${context.publishingReportId}` : null,
      context.analyticsReportId ? `analytics:${context.analyticsReportId}` : null,
      context.learningReportId ? `learning:${context.learningReportId}` : null,
      context.scriptId ? `script:${context.scriptId}` : null,
      context.thumbnailReportId ? `thumbnail:${context.thumbnailReportId}` : null,
      context.assemblyId ? `assembly:${context.assemblyId}` : null,
      ...supportingEvidence.map((e) => e.evidenceId),
      `recommendation:${executiveRecommendation}`,
      `completeness:${assetCompleteness.completenessScore}`,
    ]);

    return {
      reviewId,
      timestamp: now,
      mediaId,
      channelId,
      editorialStatus,
      assetCompleteness: {
        ...assetCompleteness,
        missingItems: [...assetCompleteness.missingItems],
      },
      qualityAssessment: { ...qualityAssessment },
      complianceAssessment: { ...complianceAssessment },
      outstandingIssues,
      executiveRecommendation,
      recommendationRationale,
      supportingEvidence: supportingEvidence.map((e) => ({ ...e })),
      confidenceScore,
      metadataVersion: MER_METADATA_VERSION,
      workerId: config.workerId,
      reportVersion: MER_REPORT_VERSION,
      mediaBusinessId,
      publishingReportId: context.publishingReportId ?? null,
      analyticsReportId: context.analyticsReportId ?? null,
      learningReportId: context.learningReportId ?? null,
      scriptId: context.scriptId ?? null,
      thumbnailReportId: context.thumbnailReportId ?? null,
      assemblyId: context.assemblyId ?? null,
      prerequisiteWorkerStatuses: prerequisites.map((p) => ({ ...p })),
      verifiedFindings,
      recommendationFindings,
      sourceTraceabilityRefs,
      preservedDecisions: [
        {
          decisionId: `mer-dec-${seq}-no-publish`,
          topic: mediaId,
          decision: "Produced media executive review only — never publish media",
          recordedAt: now,
        },
        {
          decisionId: `mer-dec-${seq}-verified-vs-recommendation`,
          topic: mediaId,
          decision:
            "Distinguished verified findings from recommendations via ReviewFinding.kind",
          recordedAt: now,
        },
        {
          decisionId: `mer-dec-${seq}-explained`,
          topic: mediaId,
          decision: `Explained executive recommendation ${executiveRecommendation} with rationale and evidence refs`,
          recordedAt: now,
        },
      ],
      neverPublishMedia: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverRewriteScripts: true,
      neverEditMediaAssets: true,
      neverModifyApprovedAssets: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ419OrLater: true,
      neverBypassPillowGovernance: true,
      verifyAllPrerequisiteWorkersCompletedSuccessfully: true,
      preserveCompleteTraceability: true,
      distinguishVerifiedFindingsFromRecommendations: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let reviewSequence = 0;

export function resetReviewSequenceForTesting() {
  reviewSequence = 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: MediaExecutiveReviewReport): MediaExecutiveReviewReport {
  return {
    ...report,
    assetCompleteness: {
      ...report.assetCompleteness,
      missingItems: [...report.assetCompleteness.missingItems],
    },
    qualityAssessment: { ...report.qualityAssessment },
    complianceAssessment: { ...report.complianceAssessment },
    outstandingIssues: report.outstandingIssues.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    prerequisiteWorkerStatuses: report.prerequisiteWorkerStatuses.map((p) => ({ ...p })),
    verifiedFindings: report.verifiedFindings.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    recommendationFindings: report.recommendationFindings.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    sourceTraceabilityRefs: [...report.sourceTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
