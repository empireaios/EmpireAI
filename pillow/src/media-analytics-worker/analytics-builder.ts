import type { MediaAnalyticsWorkerConfiguration } from "./configuration.js";
import {
  ANALYTICS_PLATFORMS,
  COMPARISON_DIMENSIONS,
  MAW_METADATA_VERSION,
  MAW_REPORT_VERSION,
  METRIC_SOURCES,
} from "./paths.js";
import type {
  AnalyticsContext,
  AnalyticsPlatform,
  ComparisonDimension,
  ComparisonEntry,
  ComparisonTargetInput,
  EngagementMetrics,
  IntegrationHandshake,
  MediaAnalyticsReport,
  MediaAnalyticsWorkerCatalog,
  MediaAnalyticsWorkerInput,
  MetricSource,
  MetricValue,
  PerformancePattern,
  RetentionMetrics,
  RevenueMetrics,
  SubscriberImpact,
} from "./types.js";

/** Pure Media Analytics Worker helpers for Q4-15 — structural signals only. */
export class AnalyticsBuilder {
  buildCatalog(
    config: MediaAnalyticsWorkerConfiguration,
    reports: MediaAnalyticsReport[],
    integrations: IntegrationHandshake[],
  ): MediaAnalyticsWorkerCatalog {
    return {
      reportVersion: MAW_REPORT_VERSION,
      workerId: config.workerId,
      analyticsReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      supportedPlatforms: [...ANALYTICS_PLATFORMS],
      metricSources: [...METRIC_SOURCES],
      metadataVersion: MAW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverRewriteContent: true,
      neverChangePublishingSchedules: true,
      neverModifyChannelStrategy: true,
      neverExecuteOptimizations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ416OrLater: true,
      neverAlterSourceAnalyticsData: true,
    };
  }

  mergeContext(input: MediaAnalyticsWorkerInput, context: AnalyticsContext): AnalyticsContext {
    const hasCoreMetric =
      input.views != null ||
      input.impressions != null ||
      input.clickThroughRate != null ||
      input.watchTimeHours != null ||
      input.averageViewPercentage != null ||
      input.likes != null ||
      input.comments != null ||
      input.shares != null ||
      input.subscribersGained != null ||
      input.subscribersLost != null ||
      input.estimatedRevenueUsd != null ||
      input.revenueAvailable != null;
    const receivedMetrics =
      context.receivedMetrics ||
      hasCoreMetric ||
      Boolean(input.mediaId?.trim());
    // Empty-array trap: use .length for comparisonTargets
    const comparisonTargets =
      input.comparisonTargets && input.comparisonTargets.length > 0
        ? input.comparisonTargets.map((t) => ({ ...t }))
        : context.comparisonTargets && context.comparisonTargets.length > 0
          ? context.comparisonTargets.map((t) => ({ ...t }))
          : [];
    return {
      mediaBusinessId: input.mediaBusinessId ?? context.mediaBusinessId ?? null,
      channelId: input.channelId ?? context.channelId ?? null,
      mediaId: input.mediaId ?? context.mediaId ?? null,
      platform: this.resolvePlatform(input.platform) ?? context.platform ?? null,
      publishingReportId: input.publishingReportId ?? context.publishingReportId ?? null,
      views: input.views ?? context.views ?? null,
      impressions: input.impressions ?? context.impressions ?? null,
      clickThroughRate: input.clickThroughRate ?? context.clickThroughRate ?? null,
      watchTimeHours: input.watchTimeHours ?? context.watchTimeHours ?? null,
      averageViewPercentage: input.averageViewPercentage ?? context.averageViewPercentage ?? null,
      likes: input.likes ?? context.likes ?? null,
      comments: input.comments ?? context.comments ?? null,
      shares: input.shares ?? context.shares ?? null,
      subscribersGained: input.subscribersGained ?? context.subscribersGained ?? null,
      subscribersLost: input.subscribersLost ?? context.subscribersLost ?? null,
      estimatedRevenueUsd: input.estimatedRevenueUsd ?? context.estimatedRevenueUsd ?? null,
      revenueAvailable: input.revenueAvailable ?? context.revenueAvailable ?? null,
      contentFormat: input.contentFormat ?? context.contentFormat ?? null,
      topicId: input.topicId ?? context.topicId ?? null,
      hookReportId: input.hookReportId ?? context.hookReportId ?? null,
      topicTitle: input.topicTitle ?? context.topicTitle ?? null,
      priorViews: input.priorViews ?? context.priorViews ?? null,
      priorCtr: input.priorCtr ?? context.priorCtr ?? null,
      priorRetention: input.priorRetention ?? context.priorRetention ?? null,
      comparisonTargets,
      receivedMetrics,
      performancePatterns: context.performancePatterns ?? [],
      comparisons: context.comparisons ?? [],
      historicalSnapshotIds: context.historicalSnapshotIds ?? [],
    };
  }

  canAnalyze(context: AnalyticsContext): { ready: boolean; reason?: string } {
    if (!context.receivedMetrics) {
      return { ready: false, reason: "Platform metrics required before analytics" };
    }
    if (!context.mediaId) {
      return { ready: false, reason: "Media ID required for analytics" };
    }
    return { ready: true };
  }

  resolvePlatform(raw: string | null | undefined): AnalyticsPlatform | null {
    if (!raw) return null;
    return (ANALYTICS_PLATFORMS as readonly string[]).includes(raw)
      ? (raw as AnalyticsPlatform)
      : null;
  }

  defaultPlatform(
    context: AnalyticsContext,
    config: MediaAnalyticsWorkerConfiguration,
  ): AnalyticsPlatform {
    return (
      context.platform ??
      this.resolvePlatform(config.defaultPlatform) ??
      "youtube"
    );
  }

  private metric(
    value: number,
    unit: string,
    source: MetricSource,
    asOf: string,
  ): MetricValue {
    return { value, unit, source, asOf };
  }

  private hasProvided(value: number | null | undefined): boolean {
    return value != null && Number.isFinite(value);
  }

  trackViews(context: AnalyticsContext, asOf: string): MetricValue {
    if (this.hasProvided(context.views)) {
      return this.metric(context.views!, "count", "platform_reported", asOf);
    }
    return this.metric(0, "count", "estimated", asOf);
  }

  trackImpressions(context: AnalyticsContext, asOf: string): MetricValue {
    if (this.hasProvided(context.impressions)) {
      return this.metric(context.impressions!, "count", "platform_reported", asOf);
    }
    if (this.hasProvided(context.views)) {
      return this.metric(Math.round(context.views! * 4), "count", "estimated", asOf);
    }
    return this.metric(0, "count", "estimated", asOf);
  }

  trackClickThroughRate(
    context: AnalyticsContext,
    views: MetricValue,
    impressions: MetricValue,
    asOf: string,
  ): MetricValue {
    if (this.hasProvided(context.clickThroughRate)) {
      return this.metric(context.clickThroughRate!, "percentage", "platform_reported", asOf);
    }
    if (impressions.value > 0 && views.source !== "estimated") {
      return this.metric(
        Number(((views.value / impressions.value) * 100).toFixed(4)),
        "percentage",
        "derived",
        asOf,
      );
    }
    if (impressions.value > 0) {
      return this.metric(
        Number(((views.value / impressions.value) * 100).toFixed(4)),
        "percentage",
        "derived",
        asOf,
      );
    }
    return this.metric(0, "percentage", "estimated", asOf);
  }

  trackWatchTime(context: AnalyticsContext, asOf: string): MetricValue {
    if (this.hasProvided(context.watchTimeHours)) {
      return this.metric(context.watchTimeHours!, "hours", "platform_reported", asOf);
    }
    if (this.hasProvided(context.views)) {
      const estimatedHours = Number(((context.views! * 0.08) / 60).toFixed(4));
      return this.metric(estimatedHours, "hours", "estimated", asOf);
    }
    return this.metric(0, "hours", "estimated", asOf);
  }

  trackAudienceRetention(context: AnalyticsContext): RetentionMetrics {
    if (this.hasProvided(context.averageViewPercentage)) {
      const avg = clamp(context.averageViewPercentage!, 0, 100);
      return {
        averageViewPercentage: avg,
        retainedAt25Pct: clamp(Math.min(100, avg + 18), 0, 100),
        retainedAt50Pct: clamp(avg, 0, 100),
        retainedAt75Pct: clamp(avg * 0.72, 0, 100),
        retainedAt100Pct: clamp(avg * 0.45, 0, 100),
        source: "platform_reported",
      };
    }
    const avg = 42;
    return {
      averageViewPercentage: avg,
      retainedAt25Pct: 68,
      retainedAt50Pct: 42,
      retainedAt75Pct: 28,
      retainedAt100Pct: 16,
      source: "estimated",
    };
  }

  trackSubscriberGrowth(context: AnalyticsContext): SubscriberImpact {
    const gained = this.hasProvided(context.subscribersGained)
      ? context.subscribersGained!
      : 0;
    const lost = this.hasProvided(context.subscribersLost) ? context.subscribersLost! : 0;
    const source: MetricSource =
      this.hasProvided(context.subscribersGained) || this.hasProvided(context.subscribersLost)
        ? "platform_reported"
        : "estimated";
    return {
      netSubscribers: gained - lost,
      subscribersGained: gained,
      subscribersLost: lost,
      source,
    };
  }

  trackEngagementMetrics(context: AnalyticsContext, views: MetricValue): EngagementMetrics {
    const likes = this.hasProvided(context.likes) ? context.likes! : 0;
    const comments = this.hasProvided(context.comments) ? context.comments! : 0;
    const shares = this.hasProvided(context.shares) ? context.shares! : 0;
    const provided =
      this.hasProvided(context.likes) ||
      this.hasProvided(context.comments) ||
      this.hasProvided(context.shares);
    const engagementRate = Number(
      (((likes + comments + shares) / Math.max(views.value, 1)) * 100).toFixed(4),
    );
    return {
      likes,
      comments,
      shares,
      engagementRate,
      source: provided ? "platform_reported" : "estimated",
    };
  }

  trackRevenueWhereAvailable(context: AnalyticsContext): RevenueMetrics {
    if (context.revenueAvailable === false || context.estimatedRevenueUsd == null) {
      return {
        available: false,
        estimatedRevenueUsd: null,
        currency: "USD",
        source: context.revenueAvailable === false ? "platform_reported" : "estimated",
        notes: "Revenue not available for this media asset",
      };
    }
    return {
      available: true,
      estimatedRevenueUsd: context.estimatedRevenueUsd,
      currency: "USD",
      source: "platform_reported",
      notes: "Platform-reported or provided revenue estimate preserved without mutation",
    };
  }

  detectPerformancePatterns(
    context: AnalyticsContext,
    ctr: MetricValue,
    retention: RetentionMetrics,
    engagement: EngagementMetrics,
    revenue: RevenueMetrics,
    seq: number,
  ): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];
    const push = (
      classification: PerformancePattern["classification"],
      dimension: PerformancePattern["dimension"],
      summary: string,
      evidenceRefs: string[],
      severity: PerformancePattern["severity"],
    ) => {
      patterns.push({
        patternId: `maw-pat-${seq}-${patterns.length + 1}`,
        classification,
        dimension,
        summary,
        evidenceRefs,
        severity,
      });
    };

    if (ctr.value >= 6 || retention.averageViewPercentage >= 50 || engagement.engagementRate >= 8) {
      push(
        "strong",
        ctr.value >= 6 ? "ctr" : retention.averageViewPercentage >= 50 ? "retention" : "engagement",
        `Strong performance: CTR=${ctr.value}% retention=${retention.averageViewPercentage}% engagement=${engagement.engagementRate}%`,
        [
          `ctr:${ctr.value}`,
          `retention:${retention.averageViewPercentage}`,
          `engagement:${engagement.engagementRate}`,
        ],
        "notable",
      );
    }
    if (ctr.value < 2 || retention.averageViewPercentage < 25 || engagement.engagementRate < 1.5) {
      push(
        "weak",
        ctr.value < 2 ? "ctr" : retention.averageViewPercentage < 25 ? "retention" : "engagement",
        `Weak performance: CTR=${ctr.value}% retention=${retention.averageViewPercentage}% engagement=${engagement.engagementRate}%`,
        [
          `ctr:${ctr.value}`,
          `retention:${retention.averageViewPercentage}`,
          `engagement:${engagement.engagementRate}`,
        ],
        ctr.value < 1 || retention.averageViewPercentage < 15 ? "critical" : "notable",
      );
    }
    if (context.contentFormat?.trim()) {
      push(
        "emerging",
        "format",
        `Format signal for ${context.contentFormat}`,
        [`format:${context.contentFormat}`],
        "info",
      );
    }
    if (context.topicId?.trim() || context.topicTitle?.trim()) {
      push(
        "emerging",
        "topic",
        `Topic signal for ${context.topicId ?? context.topicTitle}`,
        [context.topicId ? `topic:${context.topicId}` : `topicTitle:${context.topicTitle}`],
        "info",
      );
    }
    if (context.hookReportId?.trim()) {
      push(
        "emerging",
        "hook",
        `Hook analytics linked to ${context.hookReportId}`,
        [`hook:${context.hookReportId}`],
        "info",
      );
    }
    if (context.channelId?.trim()) {
      push(
        "neutral",
        "channel",
        `Channel-level analytics preserved for ${context.channelId}`,
        [`channel:${context.channelId}`],
        "info",
      );
    }
    if (revenue.available && revenue.estimatedRevenueUsd != null && revenue.estimatedRevenueUsd > 0) {
      push(
        "strong",
        "revenue",
        `Revenue available: $${revenue.estimatedRevenueUsd} USD`,
        [`revenue:${revenue.estimatedRevenueUsd}`],
        "notable",
      );
    }
    // Empty-array trap: comparisonTargets.length
    if (context.comparisonTargets && context.comparisonTargets.length > 0) {
      for (const target of context.comparisonTargets) {
        const dim = this.resolveComparisonDimension(target.dimension) ?? "video";
        push(
          "emerging",
          dim,
          `Comparison target ${target.id} on ${dim}`,
          [`comparison:${target.id}`, `dimension:${dim}`],
          "info",
        );
      }
    }
    if (patterns.length === 0) {
      push(
        "neutral",
        "video",
        "Neutral baseline performance — no strong or weak threshold crossed",
        [`ctr:${ctr.value}`, `retention:${retention.averageViewPercentage}`],
        "info",
      );
    }
    return patterns;
  }

  compareVideosFormatsTopicsHooksChannels(
    context: AnalyticsContext,
    mediaId: string,
    views: MetricValue,
    ctr: MetricValue,
    retention: RetentionMetrics,
    seq: number,
  ): ComparisonEntry[] {
    // Empty-array trap
    if (!context.comparisonTargets || context.comparisonTargets.length === 0) {
      return [];
    }
    return context.comparisonTargets.map((target, index) =>
      this.compareOne(target, mediaId, views, ctr, retention, seq, index),
    );
  }

  private compareOne(
    target: ComparisonTargetInput,
    mediaId: string,
    views: MetricValue,
    ctr: MetricValue,
    retention: RetentionMetrics,
    seq: number,
    index: number,
  ): ComparisonEntry {
    const dimension = this.resolveComparisonDimension(target.dimension) ?? "video";
    const leftViews = views.value;
    const rightViews = target.views ?? 0;
    const leftCtr = ctr.value;
    const rightCtr = target.ctr ?? 0;
    const leftRetention = retention.averageViewPercentage;
    const rightRetention = target.retention ?? 0;
    let winnerId: string | null = null;
    if (leftViews !== rightViews) {
      winnerId = leftViews > rightViews ? mediaId : target.id;
    } else if (leftCtr !== rightCtr) {
      winnerId = leftCtr > rightCtr ? mediaId : target.id;
    } else if (leftRetention !== rightRetention) {
      winnerId = leftRetention > rightRetention ? mediaId : target.id;
    }
    return {
      comparisonId: `maw-cmp-${seq}-${index + 1}`,
      leftId: mediaId,
      rightId: target.id,
      dimension,
      winnerId,
      deltaSummary: `views Δ${Number((leftViews - rightViews).toFixed(2))}, ctr Δ${Number((leftCtr - rightCtr).toFixed(2))}, retention Δ${Number((leftRetention - rightRetention).toFixed(2))}`,
      metricsCompared: ["views", "ctr", "retention"],
    };
  }

  resolveComparisonDimension(raw: string | null | undefined): ComparisonDimension | null {
    if (!raw) return null;
    return (COMPARISON_DIMENSIONS as readonly string[]).includes(raw)
      ? (raw as ComparisonDimension)
      : null;
  }

  detectMeaningfulChange(
    context: AnalyticsContext,
    views: MetricValue,
    ctr: MetricValue,
    retention: RetentionMetrics,
  ): boolean {
    if (this.hasProvided(context.priorViews) && context.priorViews! > 0) {
      const delta = Math.abs(views.value - context.priorViews!) / context.priorViews!;
      if (delta >= 0.2) return true;
    }
    if (this.hasProvided(context.priorCtr)) {
      if (Math.abs(ctr.value - context.priorCtr!) >= 1.5) return true;
    }
    if (this.hasProvided(context.priorRetention)) {
      if (Math.abs(retention.averageViewPercentage - context.priorRetention!) >= 8) {
        return true;
      }
    }
    return false;
  }

  computeConfidenceScore(metrics: MetricValue[]): number {
    let score = 70;
    for (const metric of metrics) {
      if (metric.source === "platform_reported") score += 5;
    }
    return Math.min(100, score);
  }

  buildAnalyticsReport(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
    context: AnalyticsContext,
    options: {
      performancePatterns?: PerformancePattern[];
      comparisons?: ComparisonEntry[];
      historicalSnapshotIds?: string[];
    } = {},
  ): MediaAnalyticsReport {
    analyticsSequence += 1;
    const seq = analyticsSequence;
    const now = new Date().toISOString();
    const platform = this.defaultPlatform(context, config);
    const mediaId = context.mediaId?.trim() || input.mediaId?.trim() || `media-maw-${seq}`;
    const analyticsReportId =
      input.analyticsReportId?.trim() || `maw-rpt-${Date.now()}-${seq}`;
    const channelId = context.channelId?.trim() || input.channelId?.trim() || `chn-maw-${seq}`;
    const mediaBusinessId =
      context.mediaBusinessId?.trim() ||
      input.mediaBusinessId?.trim() ||
      `biz-media-${channelId}`;

    const views = this.trackViews({ ...context, mediaId }, now);
    const impressions = this.trackImpressions({ ...context, mediaId }, now);
    const clickThroughRate = this.trackClickThroughRate(
      { ...context, mediaId },
      views,
      impressions,
      now,
    );
    const watchTime = this.trackWatchTime({ ...context, mediaId }, now);
    const retentionMetrics = this.trackAudienceRetention({ ...context, mediaId });
    const subscriberImpact = this.trackSubscriberGrowth({ ...context, mediaId });
    const engagementMetrics = this.trackEngagementMetrics({ ...context, mediaId }, views);
    const revenueMetrics = this.trackRevenueWhereAvailable({ ...context, mediaId });

    // Empty-array trap for performancePatterns
    const performancePatterns =
      options.performancePatterns && options.performancePatterns.length > 0
        ? options.performancePatterns
        : context.performancePatterns && context.performancePatterns.length > 0
          ? context.performancePatterns
          : this.detectPerformancePatterns(
              { ...context, mediaId },
              clickThroughRate,
              retentionMetrics,
              engagementMetrics,
              revenueMetrics,
              seq,
            );

    // Empty-array trap for comparisons
    const comparisons =
      options.comparisons && options.comparisons.length > 0
        ? options.comparisons
        : context.comparisons && context.comparisons.length > 0
          ? context.comparisons
          : this.compareVideosFormatsTopicsHooksChannels(
              { ...context, mediaId },
              mediaId,
              views,
              clickThroughRate,
              retentionMetrics,
              seq,
            );

    const meaningfulChangeDetected = this.detectMeaningfulChange(
      context,
      views,
      clickThroughRate,
      retentionMetrics,
    );

    const confidenceScore = this.computeConfidenceScore([
      views,
      impressions,
      clickThroughRate,
      watchTime,
    ]);

    // Empty-array trap for historicalSnapshotIds
    const historicalSnapshotIds =
      options.historicalSnapshotIds && options.historicalSnapshotIds.length > 0
        ? [...options.historicalSnapshotIds]
        : context.historicalSnapshotIds && context.historicalSnapshotIds.length > 0
          ? [...context.historicalSnapshotIds]
          : [`maw-hist-${seq}-${mediaId}`];

    return {
      analyticsReportId,
      timestamp: now,
      mediaBusinessId,
      channelId,
      mediaId,
      platform,
      views: { ...views },
      impressions: { ...impressions },
      clickThroughRate: { ...clickThroughRate },
      watchTime: { ...watchTime },
      retentionMetrics: { ...retentionMetrics },
      subscriberImpact: { ...subscriberImpact },
      engagementMetrics: { ...engagementMetrics },
      revenueMetrics: { ...revenueMetrics },
      performancePatterns: performancePatterns.map((p) => ({
        ...p,
        evidenceRefs: [...p.evidenceRefs],
      })),
      comparisons: comparisons.map((c) => ({
        ...c,
        metricsCompared: [...c.metricsCompared],
      })),
      confidenceScore,
      metadataVersion: MAW_METADATA_VERSION,
      workerId: config.workerId,
      reportVersion: MAW_REPORT_VERSION,
      contentFormat: context.contentFormat ?? null,
      topicId: context.topicId ?? null,
      hookReportId: context.hookReportId ?? null,
      publishingReportId: context.publishingReportId ?? null,
      metricTraceabilityRefs: unique([
        `media:${mediaId}`,
        `channel:${channelId}`,
        `business:${mediaBusinessId}`,
        `platform:${platform}`,
        `views:${views.source}:${views.value}`,
        `impressions:${impressions.source}:${impressions.value}`,
        `ctr:${clickThroughRate.source}:${clickThroughRate.value}`,
        `watchTime:${watchTime.source}:${watchTime.value}`,
        `retention:${retentionMetrics.source}:${retentionMetrics.averageViewPercentage}`,
        `engagement:${engagementMetrics.source}:${engagementMetrics.engagementRate}`,
        `subscribers:${subscriberImpact.source}:${subscriberImpact.netSubscribers}`,
        `revenue:${revenueMetrics.source}:${revenueMetrics.available}`,
        context.publishingReportId ? `publishing:${context.publishingReportId}` : null,
        context.hookReportId ? `hook:${context.hookReportId}` : null,
        context.topicId ? `topic:${context.topicId}` : null,
        ...historicalSnapshotIds.map((id) => `history:${id}`),
      ]),
      preservedDecisions: [
        {
          decisionId: `maw-dec-${seq}-no-mutation`,
          topic: mediaId,
          decision:
            "Produced media analytics report only — never alter source analytics data or rewrite content",
          recordedAt: now,
        },
        {
          decisionId: `maw-dec-${seq}-source-distinction`,
          topic: platform,
          decision: `Distinguished platform-reported metrics from estimates (views=${views.source}, ctr=${clickThroughRate.source})`,
          recordedAt: now,
        },
      ],
      historicalSnapshotIds,
      meaningfulChangeDetected,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverRewriteContent: true,
      neverChangePublishingSchedules: true,
      neverModifyChannelStrategy: true,
      neverExecuteOptimizations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ416OrLater: true,
      neverAlterSourceAnalyticsData: true,
      preserveCompleteMetricTraceability: true,
      preserveHistoricalPerformanceRecords: true,
      distinguishPlatformReportedFromEstimates: true,
      detectMeaningfulPerformanceChanges: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let analyticsSequence = 0;

export function resetAnalyticsSequenceForTesting() {
  analyticsSequence = 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function cloneReport(report: MediaAnalyticsReport): MediaAnalyticsReport {
  return {
    ...report,
    views: { ...report.views },
    impressions: { ...report.impressions },
    clickThroughRate: { ...report.clickThroughRate },
    watchTime: { ...report.watchTime },
    retentionMetrics: { ...report.retentionMetrics },
    subscriberImpact: { ...report.subscriberImpact },
    engagementMetrics: { ...report.engagementMetrics },
    revenueMetrics: { ...report.revenueMetrics },
    performancePatterns: report.performancePatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    comparisons: report.comparisons.map((c) => ({
      ...c,
      metricsCompared: [...c.metricsCompared],
    })),
    metricTraceabilityRefs: [...report.metricTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    historicalSnapshotIds: [...report.historicalSnapshotIds],
  };
}
