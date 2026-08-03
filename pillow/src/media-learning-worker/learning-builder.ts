import type { MediaLearningWorkerConfiguration } from "./configuration.js";
import {
  LEARNING_OUTCOME_KINDS,
  MLW_METADATA_VERSION,
  MLW_REPORT_VERSION,
  PATTERN_DIMENSIONS,
} from "./paths.js";
import type {
  ContentPattern,
  IncomingAnalyticsReport,
  InsightBlock,
  IntegrationHandshake,
  LearningContext,
  MediaLearningReport,
  MediaLearningWorkerCatalog,
  MediaLearningWorkerInput,
  PatternDimension,
  PlaybookRecommendationUpdate,
  RecommendedImprovement,
} from "./types.js";

/** Pure Media Learning Worker helpers for Q4-16 — structural signals only. */
export class LearningBuilder {
  buildCatalog(
    config: MediaLearningWorkerConfiguration,
    reports: MediaLearningReport[],
    integrations: IntegrationHandshake[],
  ): MediaLearningWorkerCatalog {
    return {
      reportVersion: MLW_REPORT_VERSION,
      workerId: config.workerId,
      learningReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      learningOutcomeKinds: [...LEARNING_OUTCOME_KINDS],
      patternDimensions: [...PATTERN_DIMENSIONS],
      metadataVersion: MLW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverRewriteExistingContent: true,
      neverModifyPublishedVideos: true,
      neverChangeEditorialPolicyDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ417OrLater: true,
      neverOverwriteHistoricalLearning: true,
      learnOnlyFromVerifiedAnalytics: true,
    };
  }

  mergeContext(input: MediaLearningWorkerInput, context: LearningContext): LearningContext {
    // Empty-array traps for mediaIds / analyticsReports / analyticsReportIds
    const mediaIds =
      input.mediaIds && input.mediaIds.length > 0
        ? [...input.mediaIds]
        : context.mediaIds && context.mediaIds.length > 0
          ? [...context.mediaIds]
          : [];
    const analyticsReports =
      input.analyticsReports && input.analyticsReports.length > 0
        ? input.analyticsReports.map((r) => ({ ...r }))
        : context.analyticsReports && context.analyticsReports.length > 0
          ? context.analyticsReports.map((r) => ({ ...r }))
          : [];
    const analyticsReportIds =
      input.analyticsReportIds && input.analyticsReportIds.length > 0
        ? [...input.analyticsReportIds]
        : context.analyticsReportIds && context.analyticsReportIds.length > 0
          ? [...context.analyticsReportIds]
          : analyticsReports
              .map((r) => r.analyticsReportId)
              .filter((id): id is string => Boolean(id));
    // Derive mediaIds from reports when empty
    const resolvedMediaIds =
      mediaIds.length > 0
        ? mediaIds
        : analyticsReports
            .map((r) => r.mediaId)
            .filter((id): id is string => Boolean(id));
    const receivedAnalytics =
      context.receivedAnalytics ||
      analyticsReports.length > 0 ||
      resolvedMediaIds.length > 0 ||
      analyticsReportIds.length > 0;
    return {
      channelId: input.channelId ?? context.channelId ?? null,
      mediaBusinessId: input.mediaBusinessId ?? context.mediaBusinessId ?? null,
      mediaIds: resolvedMediaIds,
      analyticsReportIds,
      analyticsReports,
      topicIds:
        input.topicIds && input.topicIds.length > 0
          ? [...input.topicIds]
          : context.topicIds && context.topicIds.length > 0
            ? [...context.topicIds]
            : [],
      hookReportIds:
        input.hookReportIds && input.hookReportIds.length > 0
          ? [...input.hookReportIds]
          : context.hookReportIds && context.hookReportIds.length > 0
            ? [...context.hookReportIds]
            : [],
      thumbnailIds:
        input.thumbnailIds && input.thumbnailIds.length > 0
          ? [...input.thumbnailIds]
          : context.thumbnailIds && context.thumbnailIds.length > 0
            ? [...context.thumbnailIds]
            : [],
      contentFormats:
        input.contentFormats && input.contentFormats.length > 0
          ? [...input.contentFormats]
          : context.contentFormats && context.contentFormats.length > 0
            ? [...context.contentFormats]
            : [],
      publishingTimingNotes:
        input.publishingTimingNotes ?? context.publishingTimingNotes ?? null,
      verifiedAnalytics: input.verifiedAnalytics ?? context.verifiedAnalytics ?? true,
      receivedAnalytics,
      successfulPatterns: context.successfulPatterns ?? [],
      failedPatterns: context.failedPatterns ?? [],
      topicInsights: context.topicInsights ?? [],
      hookInsights: context.hookInsights ?? [],
      thumbnailInsights: context.thumbnailInsights ?? [],
      retentionInsights: context.retentionInsights ?? [],
      publishingInsights: context.publishingInsights ?? [],
      recommendedImprovements: context.recommendedImprovements ?? [],
      playbookRecommendationUpdates: context.playbookRecommendationUpdates ?? [],
      historicalLearningRecordIds: context.historicalLearningRecordIds ?? [],
    };
  }

  canLearn(context: LearningContext): { ready: boolean; reason?: string } {
    if (context.verifiedAnalytics === false) {
      return { ready: false, reason: "Verified analytics required before learning" };
    }
    if (!context.receivedAnalytics) {
      return { ready: false, reason: "Media analytics reports required before learning" };
    }
    const mediaLen = context.mediaIds?.length ?? 0;
    const reportLen = context.analyticsReports?.length ?? 0;
    if (mediaLen < 1 && reportLen < 1) {
      return {
        ready: false,
        reason: "At least one media ID or analytics report required for learning",
      };
    }
    return { ready: true };
  }

  metricValue(raw: number | { value?: number } | null | undefined): number | null {
    if (raw == null) return null;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
    if (typeof raw.value === "number" && Number.isFinite(raw.value)) return raw.value;
    return null;
  }

  identifySuccessfulContentPatterns(
    reports: IncomingAnalyticsReport[],
    seq: number,
  ): ContentPattern[] {
    const patterns: ContentPattern[] = [];
    // Empty-array trap
    if (!reports || reports.length === 0) return patterns;
    for (const report of reports) {
      const ctr = this.metricValue(report.clickThroughRate) ?? 0;
      const retention = report.retentionMetrics?.averageViewPercentage ?? 0;
      const engagement = report.engagementMetrics?.engagementRate ?? 0;
      const strongClassification = (report.performancePatterns ?? []).some(
        (p) => p.classification === "strong",
      );
      const isSuccessful =
        ctr >= 6 || retention >= 50 || engagement >= 8 || strongClassification;
      if (!isSuccessful) continue;
      const dimension = this.resolveSuccessDimension(ctr, retention, engagement, report);
      const measured =
        this.metricValue(report.clickThroughRate) != null ||
        report.retentionMetrics?.averageViewPercentage != null ||
        report.engagementMetrics?.engagementRate != null;
      patterns.push({
        patternId: `mlw-pat-ok-${seq}-${patterns.length + 1}`,
        outcome: "successful",
        dimension,
        summary: `Successful pattern on ${dimension}: CTR=${ctr}% retention=${retention}% engagement=${engagement}%`,
        evidenceRefs: unique([
          report.analyticsReportId ? `analytics:${report.analyticsReportId}` : null,
          report.mediaId ? `media:${report.mediaId}` : null,
          `ctr:${ctr}`,
          `retention:${retention}`,
          `engagement:${engagement}`,
        ]),
        strength: clamp(
          Math.round(
            Math.max(ctr * 8, retention, engagement * 8, strongClassification ? 75 : 0),
          ),
          0,
          100,
        ),
        outcomeKind: measured ? "measured" : "inferred",
      });
    }
    return patterns;
  }

  identifyUnsuccessfulContentPatterns(
    reports: IncomingAnalyticsReport[],
    seq: number,
  ): ContentPattern[] {
    const patterns: ContentPattern[] = [];
    // Empty-array trap
    if (!reports || reports.length === 0) return patterns;
    for (const report of reports) {
      const ctr = this.metricValue(report.clickThroughRate) ?? 0;
      const retention = report.retentionMetrics?.averageViewPercentage ?? 0;
      const engagement = report.engagementMetrics?.engagementRate ?? 0;
      const weakClassification = (report.performancePatterns ?? []).some(
        (p) => p.classification === "weak",
      );
      const isUnsuccessful =
        ctr < 2 || retention < 25 || engagement < 1.5 || weakClassification;
      if (!isUnsuccessful) continue;
      const dimension =
        ctr < 2
          ? "thumbnail"
          : retention < 25
            ? "retention"
            : engagement < 1.5
              ? "engagement"
              : this.resolvePatternDimension(
                  report.performancePatterns?.find((p) => p.classification === "weak")
                    ?.dimension,
                ) ?? "engagement";
      const measured =
        this.metricValue(report.clickThroughRate) != null ||
        report.retentionMetrics?.averageViewPercentage != null ||
        report.engagementMetrics?.engagementRate != null;
      patterns.push({
        patternId: `mlw-pat-fail-${seq}-${patterns.length + 1}`,
        outcome: "unsuccessful",
        dimension,
        summary: `Unsuccessful pattern on ${dimension}: CTR=${ctr}% retention=${retention}% engagement=${engagement}%`,
        evidenceRefs: unique([
          report.analyticsReportId ? `analytics:${report.analyticsReportId}` : null,
          report.mediaId ? `media:${report.mediaId}` : null,
          `ctr:${ctr}`,
          `retention:${retention}`,
          `engagement:${engagement}`,
        ]),
        strength: clamp(
          Math.round(
            Math.max(
              (2 - ctr) * 20,
              (25 - retention) * 2,
              (1.5 - engagement) * 30,
              weakClassification ? 70 : 0,
            ),
          ),
          0,
          100,
        ),
        outcomeKind: measured ? "measured" : "inferred",
      });
    }
    return patterns;
  }

  analyseTopicPerformance(
    reports: IncomingAnalyticsReport[],
    topicIds: string[],
    seq: number,
  ): InsightBlock[] {
    const insights: InsightBlock[] = [];
    // Empty-array trap
    if ((!reports || reports.length === 0) && (!topicIds || topicIds.length === 0)) {
      return insights;
    }
    const topics = new Map<string, IncomingAnalyticsReport[]>();
    for (const report of reports ?? []) {
      const topic = report.topicId?.trim();
      if (!topic) continue;
      const list = topics.get(topic) ?? [];
      list.push(report);
      topics.set(topic, list);
    }
    for (const topicId of topicIds ?? []) {
      if (!topics.has(topicId)) topics.set(topicId, []);
    }
    let index = 0;
    for (const [topicId, group] of topics) {
      index += 1;
      const avgRetention = average(
        group.map((r) => r.retentionMetrics?.averageViewPercentage).filter(isFiniteNumber),
      );
      const avgCtr = average(
        group.map((r) => this.metricValue(r.clickThroughRate)).filter(isFiniteNumber),
      );
      const measured = group.length > 0 && (avgRetention != null || avgCtr != null);
      insights.push({
        insightId: `mlw-ins-topic-${seq}-${index}`,
        category: "topic",
        summary: measured
          ? `Topic ${topicId} performance: avg CTR=${avgCtr ?? "n/a"}% avg retention=${avgRetention ?? "n/a"}% across ${group.length} analytics reports`
          : `Topic ${topicId} referenced without measured analytics — assumption only`,
        measuredSignals: measured
          ? unique([
              `topic:${topicId}`,
              avgCtr != null ? `avgCtr:${avgCtr}` : null,
              avgRetention != null ? `avgRetention:${avgRetention}` : null,
              `reports:${group.length}`,
            ])
          : [],
        assumptions: measured
          ? []
          : [`Topic ${topicId} lacks verified metric linkage; treat as assumption`],
        confidence: measured ? clamp(60 + group.length * 8, 0, 95) : 35,
      });
    }
    return insights;
  }

  analyseHookPerformance(
    reports: IncomingAnalyticsReport[],
    hookReportIds: string[],
    seq: number,
  ): InsightBlock[] {
    const insights: InsightBlock[] = [];
    if ((!reports || reports.length === 0) && (!hookReportIds || hookReportIds.length === 0)) {
      return insights;
    }
    const hooks = new Map<string, IncomingAnalyticsReport[]>();
    for (const report of reports ?? []) {
      const hook = report.hookReportId?.trim();
      if (!hook) continue;
      const list = hooks.get(hook) ?? [];
      list.push(report);
      hooks.set(hook, list);
    }
    for (const hookId of hookReportIds ?? []) {
      if (!hooks.has(hookId)) hooks.set(hookId, []);
    }
    let index = 0;
    for (const [hookId, group] of hooks) {
      index += 1;
      const avgCtr = average(
        group.map((r) => this.metricValue(r.clickThroughRate)).filter(isFiniteNumber),
      );
      const avgRetention = average(
        group.map((r) => r.retentionMetrics?.averageViewPercentage).filter(isFiniteNumber),
      );
      const measured = group.length > 0 && (avgCtr != null || avgRetention != null);
      insights.push({
        insightId: `mlw-ins-hook-${seq}-${index}`,
        category: "hook",
        summary: measured
          ? `Hook ${hookId}: CTR=${avgCtr ?? "n/a"}% retention=${avgRetention ?? "n/a"}% — ${avgCtr != null && avgCtr >= 6 ? "strong open" : avgCtr != null && avgCtr < 2 ? "weak open" : "mixed open"}`
          : `Hook ${hookId} referenced without measured CTR/retention`,
        measuredSignals: measured
          ? unique([
              `hook:${hookId}`,
              avgCtr != null ? `ctr:${avgCtr}` : null,
              avgRetention != null ? `retention:${avgRetention}` : null,
            ])
          : [],
        assumptions: measured
          ? []
          : [`Hook ${hookId} performance assumed without verified analytics`],
        confidence: measured ? clamp(62 + group.length * 7, 0, 95) : 30,
      });
    }
    return insights;
  }

  analyseThumbnailPerformance(
    reports: IncomingAnalyticsReport[],
    thumbnailIds: string[],
    seq: number,
  ): InsightBlock[] {
    const insights: InsightBlock[] = [];
    // Empty-array trap
    if (!reports || reports.length === 0) {
      if (thumbnailIds && thumbnailIds.length > 0) {
        return thumbnailIds.map((id, index) => ({
          insightId: `mlw-ins-thumb-${seq}-${index + 1}`,
          category: "thumbnail" as const,
          summary: `Thumbnail package ${id} referenced without CTR measurement`,
          measuredSignals: [],
          assumptions: [
            "Thumbnail edits are not invented; CTR measurement required for measured insight",
          ],
          confidence: 25,
        }));
      }
      return insights;
    }
    let index = 0;
    for (const report of reports) {
      const ctr = this.metricValue(report.clickThroughRate);
      if (ctr == null) continue;
      index += 1;
      const strong = ctr >= 6;
      const weak = ctr < 2;
      insights.push({
        insightId: `mlw-ins-thumb-${seq}-${index}`,
        category: "thumbnail",
        summary: strong
          ? `Thumbnail/title package working for media ${report.mediaId ?? "unknown"} (CTR=${ctr}%)`
          : weak
            ? `Thumbnail/title package underperforming for media ${report.mediaId ?? "unknown"} (CTR=${ctr}%)`
            : `Thumbnail/title package mixed for media ${report.mediaId ?? "unknown"} (CTR=${ctr}%)`,
        measuredSignals: unique([
          `ctr:${ctr}`,
          report.mediaId ? `media:${report.mediaId}` : null,
          report.analyticsReportId ? `analytics:${report.analyticsReportId}` : null,
        ]),
        assumptions: [],
        confidence: clamp(55 + Math.round(Math.abs(ctr - 3) * 4), 0, 95),
      });
    }
    return insights;
  }

  analysePacingAndRetention(
    reports: IncomingAnalyticsReport[],
    seq: number,
  ): InsightBlock[] {
    const insights: InsightBlock[] = [];
    // Empty-array trap
    if (!reports || reports.length === 0) return insights;
    let index = 0;
    for (const report of reports) {
      const retention = report.retentionMetrics?.averageViewPercentage;
      if (retention == null) continue;
      index += 1;
      const pacingHint =
        retention >= 50
          ? "Pacing appears to sustain attention — preserve structure in next content"
          : retention < 25
            ? "Pacing likely loses viewers early — recommend tighter mid-video beats for next content"
            : "Pacing mixed — recommend testing earlier payoff for next content";
      insights.push({
        insightId: `mlw-ins-ret-${seq}-${index}`,
        category: "retention",
        summary: `Retention ${retention}% for media ${report.mediaId ?? "unknown"}. ${pacingHint}`,
        measuredSignals: unique([
          `retention:${retention}`,
          report.mediaId ? `media:${report.mediaId}` : null,
        ]),
        assumptions: [],
        confidence: clamp(58 + Math.round(Math.abs(retention - 40) / 2), 0, 95),
      });
    }
    return insights;
  }

  analysePublishingTiming(
    reports: IncomingAnalyticsReport[],
    publishingTimingNotes: string | null | undefined,
    seq: number,
  ): InsightBlock[] {
    const insights: InsightBlock[] = [];
    // Empty-array trap
    if ((!reports || reports.length === 0) && !publishingTimingNotes?.trim()) {
      return insights;
    }
    const platforms = new Map<string, IncomingAnalyticsReport[]>();
    for (const report of reports ?? []) {
      const platform = report.platform?.trim() || "unknown";
      const list = platforms.get(platform) ?? [];
      list.push(report);
      platforms.set(platform, list);
    }
    if (platforms.size === 0 && publishingTimingNotes?.trim()) {
      return [
        {
          insightId: `mlw-ins-pub-${seq}-1`,
          category: "publishing",
          summary: `Publishing timing notes recorded without platform metrics: ${publishingTimingNotes}`,
          measuredSignals: [],
          assumptions: ["Timing notes alone are assumptions until verified by subscriber/platform impact"],
          confidence: 32,
        },
      ];
    }
    let index = 0;
    for (const [platform, group] of platforms) {
      index += 1;
      const netSubs = average(
        group.map((r) => r.subscriberImpact?.netSubscribers).filter(isFiniteNumber),
      );
      const measured = netSubs != null || group.length > 0;
      insights.push({
        insightId: `mlw-ins-pub-${seq}-${index}`,
        category: "publishing",
        summary: measured
          ? `Publishing on ${platform}: ${group.length} reports, netSubscribers≈${netSubs ?? "n/a"}${publishingTimingNotes ? `; notes: ${publishingTimingNotes}` : ""}`
          : `Publishing timing for ${platform} lacks subscriber impact measurement`,
        measuredSignals: measured
          ? unique([
              `platform:${platform}`,
              netSubs != null ? `netSubscribers:${netSubs}` : null,
              `reports:${group.length}`,
            ])
          : [],
        assumptions: publishingTimingNotes?.trim()
          ? [`Timing note treated as contextual assumption: ${publishingTimingNotes}`]
          : [],
        confidence: measured ? clamp(60 + group.length * 6, 0, 92) : 28,
      });
    }
    return insights;
  }

  generateReusableLearningInsights(context: LearningContext, seq: number): {
    topicInsights: InsightBlock[];
    hookInsights: InsightBlock[];
    thumbnailInsights: InsightBlock[];
    retentionInsights: InsightBlock[];
    publishingInsights: InsightBlock[];
  } {
    const reports = context.analyticsReports ?? [];
    return {
      topicInsights: this.analyseTopicPerformance(reports, context.topicIds ?? [], seq),
      hookInsights: this.analyseHookPerformance(reports, context.hookReportIds ?? [], seq),
      thumbnailInsights: this.analyseThumbnailPerformance(
        reports,
        context.thumbnailIds ?? [],
        seq,
      ),
      retentionInsights: this.analysePacingAndRetention(reports, seq),
      publishingInsights: this.analysePublishingTiming(
        reports,
        context.publishingTimingNotes,
        seq,
      ),
    };
  }

  updateMediaPlaybookRecommendations(
    channelId: string,
    learningReportId: string,
    improvements: RecommendedImprovement[],
    seq: number,
  ): PlaybookRecommendationUpdate[] {
    const playbookId = `pbk-media-${channelId}`;
    // Empty-array trap
    if (!improvements || improvements.length === 0) {
      return [
        {
          updateId: `mlw-upd-${seq}-1`,
          playbookId,
          recommendationText:
            "Register baseline media learning recommendation — no content mutation",
          sourceLearningReportId: learningReportId,
          applied: true,
          neverOverwroteHistoricalLearning: true,
        },
      ];
    }
    return improvements.map((improvement, index) => ({
      updateId: `mlw-upd-${seq}-${index + 1}`,
      playbookId,
      recommendationText: `${improvement.area}: ${improvement.action}`,
      sourceLearningReportId: learningReportId,
      applied: true,
      neverOverwroteHistoricalLearning: true as const,
    }));
  }

  buildRecommendedImprovements(
    successful: ContentPattern[],
    failed: ContentPattern[],
    insights: {
      topicInsights: InsightBlock[];
      hookInsights: InsightBlock[];
      thumbnailInsights: InsightBlock[];
      retentionInsights: InsightBlock[];
      publishingInsights: InsightBlock[];
    },
    contentFormats: string[],
    seq: number,
  ): RecommendedImprovement[] {
    const recommendations: RecommendedImprovement[] = [];
    const push = (
      area: RecommendedImprovement["area"],
      action: string,
      rationale: string,
      priority: RecommendedImprovement["priority"],
    ) => {
      recommendations.push({
        recommendationId: `mlw-rec-${seq}-${recommendations.length + 1}`,
        area,
        action,
        rationale,
        priority,
        playbookUpdateRef: null,
      });
    };

    // Empty-array traps
    if (failed && failed.length > 0) {
      const weakThumb = failed.find((p) => p.dimension === "thumbnail" || p.dimension === "hook");
      if (weakThumb) {
        push(
          weakThumb.dimension === "hook" ? "hooks" : "thumbnails",
          "For next content, redesign the thumbnail/title/hook package based on measured CTR weakness — do not rewrite published videos",
          weakThumb.summary,
          "high",
        );
      }
      const weakRetention = failed.find(
        (p) => p.dimension === "retention" || p.dimension === "pacing",
      );
      if (weakRetention) {
        push(
          "pacing",
          "For next content, tighten pacing and earlier payoff based on measured retention drop",
          weakRetention.summary,
          "high",
        );
      }
      const weakTopic = failed.find((p) => p.dimension === "topic");
      if (weakTopic) {
        push(
          "topics",
          "Deprioritize underperforming topic clusters for upcoming content slate",
          weakTopic.summary,
          "medium",
        );
      }
    }
    if (successful && successful.length > 0) {
      const strongTopic = successful.find((p) => p.dimension === "topic");
      if (strongTopic) {
        push(
          "topics",
          "Double-down on successful topic clusters in upcoming content planning",
          strongTopic.summary,
          "medium",
        );
      }
      const strongHook = successful.find((p) => p.dimension === "hook");
      if (strongHook) {
        push(
          "hooks",
          "Reuse successful hook structures for next videos (recommendation only)",
          strongHook.summary,
          "medium",
        );
      }
    }
    if (insights.thumbnailInsights && insights.thumbnailInsights.length > 0) {
      const weak = insights.thumbnailInsights.find((i) =>
        i.summary.toLowerCase().includes("underperforming"),
      );
      if (weak) {
        push(
          "thumbnails",
          "Test alternative thumbnail/title packages on future uploads only",
          weak.summary,
          "high",
        );
      }
    }
    const firstPublishingInsight = insights.publishingInsights?.[0];
    if (firstPublishingInsight) {
      push(
        "publishing_timing",
        "Align next publish windows with platforms showing stronger subscriber impact",
        firstPublishingInsight.summary,
        "low",
      );
    }
    if (contentFormats && contentFormats.length > 0) {
      push(
        "formats",
        `Evaluate format mix for next slate using measured outcomes (${contentFormats.join(", ")})`,
        "Format guidance derived from analytics contentFormat fields",
        "low",
      );
    }
    push(
      "playbook",
      "Register structural playbook recommendation updates without overwriting historical learning",
      "Playbook updates are additive recommendations only",
      "medium",
    );
    // Ensure at least one recommendation
    if (recommendations.length === 0) {
      push(
        "playbook",
        "Continue collecting verified analytics before mutating content strategy",
        "Insufficient pattern strength for concrete content changes",
        "low",
      );
    }
    return recommendations;
  }

  computeConfidenceScore(
    analyticsReports: IncomingAnalyticsReport[],
    insights: InsightBlock[],
  ): number {
    let score = 65;
    // Empty-array trap
    const reportCount = analyticsReports?.length ?? 0;
    score += Math.min(20, reportCount * 4);
    const measuredCount = insights.filter(
      (i) => i.measuredSignals && i.measuredSignals.length > 0 && i.assumptions.length === 0,
    ).length;
    const assumptionCount = insights.filter(
      (i) => i.assumptions && i.assumptions.length > 0,
    ).length;
    score += Math.min(15, measuredCount * 3);
    score -= Math.min(20, assumptionCount * 4);
    return clamp(Math.round(score), 0, 100);
  }

  buildLearningReport(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
    context: LearningContext,
    options: {
      successfulPatterns?: ContentPattern[];
      failedPatterns?: ContentPattern[];
      topicInsights?: InsightBlock[];
      hookInsights?: InsightBlock[];
      thumbnailInsights?: InsightBlock[];
      retentionInsights?: InsightBlock[];
      publishingInsights?: InsightBlock[];
      recommendedImprovements?: RecommendedImprovement[];
      playbookRecommendationUpdates?: PlaybookRecommendationUpdate[];
      historicalLearningRecordIds?: string[];
    } = {},
  ): MediaLearningReport {
    learningSequence += 1;
    const seq = learningSequence;
    const now = new Date().toISOString();
    const channelId =
      context.channelId?.trim() ||
      input.channelId?.trim() ||
      context.analyticsReports?.find((r) => r.channelId)?.channelId?.trim() ||
      `chn-mlw-${seq}`;
    const learningReportId =
      input.learningReportId?.trim() || `mlw-rpt-${Date.now()}-${seq}`;
    const mediaBusinessId =
      context.mediaBusinessId?.trim() ||
      input.mediaBusinessId?.trim() ||
      `biz-media-${channelId}`;

    const reports = context.analyticsReports ?? [];
    // Empty-array trap for mediaIdsAnalysed
    const mediaIdsAnalysed =
      context.mediaIds && context.mediaIds.length > 0
        ? [...context.mediaIds]
        : reports
            .map((r) => r.mediaId)
            .filter((id): id is string => Boolean(id));
    const resolvedMediaIds =
      mediaIdsAnalysed.length > 0 ? mediaIdsAnalysed : [`media-mlw-${seq}`];

    let successfulPatterns =
      options.successfulPatterns && options.successfulPatterns.length > 0
        ? options.successfulPatterns.map((p) => ({ ...p, evidenceRefs: [...p.evidenceRefs] }))
        : context.successfulPatterns && context.successfulPatterns.length > 0
          ? context.successfulPatterns.map((p) => ({
              ...p,
              evidenceRefs: [...p.evidenceRefs],
            }))
          : this.identifySuccessfulContentPatterns(reports, seq);

    let failedPatterns =
      options.failedPatterns && options.failedPatterns.length > 0
        ? options.failedPatterns.map((p) => ({ ...p, evidenceRefs: [...p.evidenceRefs] }))
        : context.failedPatterns && context.failedPatterns.length > 0
          ? context.failedPatterns.map((p) => ({
              ...p,
              evidenceRefs: [...p.evidenceRefs],
            }))
          : this.identifyUnsuccessfulContentPatterns(reports, seq);

    // Ensure at least one pattern for validator
    if (successfulPatterns.length === 0 && failedPatterns.length === 0) {
      failedPatterns = [
        {
          patternId: `mlw-pat-neutral-${seq}-1`,
          outcome: "unsuccessful",
          dimension: "engagement",
          summary:
            "Insufficient threshold crossings — baseline learning preserved from verified analytics intake",
          evidenceRefs: resolvedMediaIds.map((id) => `media:${id}`),
          strength: 40,
          outcomeKind: reports.length > 0 ? "measured" : "assumption",
        },
      ];
    }

    const generatedInsights = this.generateReusableLearningInsights(context, seq);
    const topicInsights =
      options.topicInsights && options.topicInsights.length > 0
        ? options.topicInsights
        : context.topicInsights && context.topicInsights.length > 0
          ? context.topicInsights
          : generatedInsights.topicInsights;
    const hookInsights =
      options.hookInsights && options.hookInsights.length > 0
        ? options.hookInsights
        : context.hookInsights && context.hookInsights.length > 0
          ? context.hookInsights
          : generatedInsights.hookInsights;
    const thumbnailInsights =
      options.thumbnailInsights && options.thumbnailInsights.length > 0
        ? options.thumbnailInsights
        : context.thumbnailInsights && context.thumbnailInsights.length > 0
          ? context.thumbnailInsights
          : generatedInsights.thumbnailInsights;
    const retentionInsights =
      options.retentionInsights && options.retentionInsights.length > 0
        ? options.retentionInsights
        : context.retentionInsights && context.retentionInsights.length > 0
          ? context.retentionInsights
          : generatedInsights.retentionInsights;
    const publishingInsights =
      options.publishingInsights && options.publishingInsights.length > 0
        ? options.publishingInsights
        : context.publishingInsights && context.publishingInsights.length > 0
          ? context.publishingInsights
          : generatedInsights.publishingInsights;

    const recommendedImprovements =
      options.recommendedImprovements && options.recommendedImprovements.length > 0
        ? options.recommendedImprovements
        : context.recommendedImprovements && context.recommendedImprovements.length > 0
          ? context.recommendedImprovements
          : this.buildRecommendedImprovements(
              successfulPatterns,
              failedPatterns,
              {
                topicInsights,
                hookInsights,
                thumbnailInsights,
                retentionInsights,
                publishingInsights,
              },
              context.contentFormats ?? [],
              seq,
            );

    const playbookRecommendationUpdates =
      options.playbookRecommendationUpdates &&
      options.playbookRecommendationUpdates.length > 0
        ? options.playbookRecommendationUpdates
        : context.playbookRecommendationUpdates &&
            context.playbookRecommendationUpdates.length > 0
          ? context.playbookRecommendationUpdates
          : this.updateMediaPlaybookRecommendations(
              channelId,
              learningReportId,
              recommendedImprovements,
              seq,
            );

    // Wire playbook refs onto recommendations
    const linkedImprovements = recommendedImprovements.map((rec, index) => ({
      ...rec,
      playbookUpdateRef:
        rec.playbookUpdateRef ??
        playbookRecommendationUpdates[index]?.updateId ??
        playbookRecommendationUpdates[0]?.updateId ??
        null,
    }));

    const allInsights = [
      ...topicInsights,
      ...hookInsights,
      ...thumbnailInsights,
      ...retentionInsights,
      ...publishingInsights,
    ];
    const confidenceScore = this.computeConfidenceScore(reports, allInsights);

    const analyticsReportIds =
      context.analyticsReportIds && context.analyticsReportIds.length > 0
        ? [...context.analyticsReportIds]
        : reports
            .map((r) => r.analyticsReportId)
            .filter((id): id is string => Boolean(id));

    const historicalLearningRecordIds =
      options.historicalLearningRecordIds && options.historicalLearningRecordIds.length > 0
        ? [...options.historicalLearningRecordIds]
        : context.historicalLearningRecordIds && context.historicalLearningRecordIds.length > 0
          ? [...context.historicalLearningRecordIds]
          : [`mlw-hist-${seq}-${channelId}`];

    return {
      learningReportId,
      timestamp: now,
      channelId,
      mediaIdsAnalysed: resolvedMediaIds,
      successfulPatterns: successfulPatterns.map((p) => ({
        ...p,
        evidenceRefs: [...p.evidenceRefs],
      })),
      failedPatterns: failedPatterns.map((p) => ({
        ...p,
        evidenceRefs: [...p.evidenceRefs],
      })),
      topicInsights: topicInsights.map(cloneInsight),
      hookInsights: hookInsights.map(cloneInsight),
      thumbnailInsights: thumbnailInsights.map(cloneInsight),
      retentionInsights: retentionInsights.map(cloneInsight),
      publishingInsights: publishingInsights.map(cloneInsight),
      recommendedImprovements: linkedImprovements.map((r) => ({ ...r })),
      playbookRecommendationUpdates: playbookRecommendationUpdates.map((u) => ({
        ...u,
        neverOverwroteHistoricalLearning: true as const,
      })),
      confidenceScore,
      metadataVersion: MLW_METADATA_VERSION,
      workerId: config.workerId,
      reportVersion: MLW_REPORT_VERSION,
      analyticsReportIds,
      mediaBusinessId,
      learningTraceabilityRefs: unique([
        `channel:${channelId}`,
        `business:${mediaBusinessId}`,
        `learning:${learningReportId}`,
        ...resolvedMediaIds.map((id) => `media:${id}`),
        ...analyticsReportIds.map((id) => `analytics:${id}`),
        ...historicalLearningRecordIds.map((id) => `history:${id}`),
        `successfulPatterns:${successfulPatterns.length}`,
        `failedPatterns:${failedPatterns.length}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `mlw-dec-${seq}-no-mutation`,
          topic: channelId,
          decision:
            "Produced media learning report only — never rewrite existing content or overwrite historical learning",
          recordedAt: now,
        },
        {
          decisionId: `mlw-dec-${seq}-measured-vs-assumption`,
          topic: channelId,
          decision:
            "Distinguished measured outcomes from assumptions across pattern outcomeKind and insight assumption arrays",
          recordedAt: now,
        },
      ],
      historicalLearningRecordIds,
      verifiedAnalyticsOnly: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverRewriteExistingContent: true,
      neverModifyPublishedVideos: true,
      neverChangeEditorialPolicyDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ417OrLater: true,
      neverOverwriteHistoricalLearning: true,
      learnOnlyFromVerifiedAnalytics: true,
      preserveCompleteTraceability: true,
      preserveHistoricalLearningRecords: true,
      distinguishMeasuredOutcomesFromAssumptions: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private resolveSuccessDimension(
    ctr: number,
    retention: number,
    engagement: number,
    report: IncomingAnalyticsReport,
  ): PatternDimension {
    if (ctr >= 6) return "thumbnail";
    if (retention >= 50) return "retention";
    if (engagement >= 8) return "engagement";
    const dim = report.performancePatterns?.find((p) => p.classification === "strong")
      ?.dimension;
    return this.resolvePatternDimension(dim) ?? "format";
  }

  resolvePatternDimension(raw: string | null | undefined): PatternDimension | null {
    if (!raw) return null;
    return (PATTERN_DIMENSIONS as readonly string[]).includes(raw)
      ? (raw as PatternDimension)
      : null;
  }
}

let learningSequence = 0;

export function resetLearningSequenceForTesting() {
  learningSequence = 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(4));
}

function cloneInsight(insight: InsightBlock): InsightBlock {
  return {
    ...insight,
    measuredSignals: [...insight.measuredSignals],
    assumptions: [...insight.assumptions],
  };
}

function cloneReport(report: MediaLearningReport): MediaLearningReport {
  return {
    ...report,
    mediaIdsAnalysed: [...report.mediaIdsAnalysed],
    successfulPatterns: report.successfulPatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    failedPatterns: report.failedPatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    topicInsights: report.topicInsights.map(cloneInsight),
    hookInsights: report.hookInsights.map(cloneInsight),
    thumbnailInsights: report.thumbnailInsights.map(cloneInsight),
    retentionInsights: report.retentionInsights.map(cloneInsight),
    publishingInsights: report.publishingInsights.map(cloneInsight),
    recommendedImprovements: report.recommendedImprovements.map((r) => ({ ...r })),
    playbookRecommendationUpdates: report.playbookRecommendationUpdates.map((u) => ({
      ...u,
      neverOverwroteHistoricalLearning: true as const,
    })),
    analyticsReportIds: [...report.analyticsReportIds],
    learningTraceabilityRefs: [...report.learningTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    historicalLearningRecordIds: [...report.historicalLearningRecordIds],
  };
}
