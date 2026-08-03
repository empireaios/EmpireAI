import { nextAssetId } from "./analytics-store.js";
import type {
  AnwInput,
  ClickMetrics,
  CommissionSummary,
  ConversionMetrics,
  FunnelFixture,
  FunnelPerformance,
  KpiDashboard,
  MetricSnapshot,
  OptimisationOpportunity,
  OpportunityFixture,
  RevenueSummary,
  SeoFixture,
  SeoPerformance,
  TrendAnalysis,
  TrendDirection,
} from "./types.js";

export function resolveOpportunity(input: AnwInput): OpportunityFixture | null {
  return input.opportunityReport ?? input.fixtureOpportunity ?? null;
}

export function resolveSeo(input: AnwInput): SeoFixture | null {
  return input.seoReport ?? input.fixtureSeo ?? null;
}

export function resolveFunnel(input: AnwInput): FunnelFixture | null {
  return input.funnelReport ?? input.fixtureFunnel ?? null;
}

export function resolveSnapshot(input: AnwInput): MetricSnapshot {
  return { ...(input.metricSnapshot ?? input.fixtureMetrics ?? {}) };
}

function num(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function rate(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return Number((numerator / denominator).toFixed(4));
}

function direction(current: number | null, prior: number | null): TrendDirection {
  if (current == null || prior == null) return "unknown";
  if (current > prior) return "up";
  if (current < prior) return "down";
  return "flat";
}

export function buildClickMetrics(snapshot: MetricSnapshot): ClickMetrics {
  const clicks = num(snapshot.clicks);
  const impressions = num(snapshot.impressions);
  return {
    metricsId: nextAssetId("clicks"),
    clicks,
    uniqueClicks: num(snapshot.uniqueClicks),
    impressions,
    ctr: rate(clicks, impressions),
    fabricated: false,
    evidencePresent: clicks != null || impressions != null,
  };
}

export function buildConversionMetrics(snapshot: MetricSnapshot): ConversionMetrics {
  const conversions = num(snapshot.conversions);
  const clicks = num(snapshot.clicks);
  return {
    metricsId: nextAssetId("conv"),
    conversions,
    conversionRate: rate(conversions, clicks),
    fabricated: false,
    evidencePresent: conversions != null,
  };
}

export function buildCommissionSummary(snapshot: MetricSnapshot): CommissionSummary {
  const commissionAmount = num(snapshot.commissionAmount);
  const clicks = num(snapshot.clicks);
  return {
    summaryId: nextAssetId("comm"),
    commissionAmount,
    currency: snapshot.currency ?? null,
    epc: rate(commissionAmount, clicks),
    fabricated: false,
    evidencePresent: commissionAmount != null,
  };
}

export function buildRevenueSummary(snapshot: MetricSnapshot): RevenueSummary {
  const revenueAmount = num(snapshot.revenueAmount);
  return {
    summaryId: nextAssetId("rev"),
    revenueAmount,
    currency: snapshot.currency ?? null,
    fabricated: false,
    evidencePresent: revenueAmount != null,
  };
}

export function buildSeoPerformance(
  snapshot: MetricSnapshot,
  seo: SeoFixture | null,
): SeoPerformance {
  const organicSessions = num(snapshot.organicSessions);
  const averageRank = num(snapshot.averageRank);
  const rankingKeywords =
    num(snapshot.rankingKeywords) ??
    (seo?.targetKeywords?.length ? seo.targetKeywords.length : null);
  const contentCompleteness = num(seo?.contentQualitySummary?.completenessScore ?? null);
  const notes: string[] = [];
  if (organicSessions == null) notes.push("Organic sessions not evidenced");
  if (averageRank == null) notes.push("Average rank not evidenced");
  if (contentCompleteness != null) {
    notes.push(`SEO content completeness=${contentCompleteness}`);
  }
  return {
    summaryId: nextAssetId("seo"),
    organicSessions,
    averageRank,
    rankingKeywords,
    contentCompleteness,
    notes,
    fabricated: false,
    evidencePresent:
      organicSessions != null ||
      averageRank != null ||
      rankingKeywords != null ||
      contentCompleteness != null,
  };
}

export function buildFunnelPerformance(
  snapshot: MetricSnapshot,
  funnel: FunnelFixture | null,
): FunnelPerformance {
  const funnelStarts = num(snapshot.funnelStarts);
  const funnelCompletions = num(snapshot.funnelCompletions);
  const emailOpens = num(snapshot.emailOpens);
  const emailClicks = num(snapshot.emailClicks);
  const stageCount = funnel?.funnelStages?.length ?? 0;
  const notes: string[] = [];
  if (funnel?.funnelName) notes.push(`funnel=${funnel.funnelName}`);
  if (funnelStarts == null && funnelCompletions == null) {
    notes.push("Funnel start/completion counts not evidenced");
  }
  if (emailOpens == null) notes.push("Email opens not evidenced — never fabricated");
  return {
    summaryId: nextAssetId("funnel"),
    funnelStarts,
    funnelCompletions,
    completionRate: rate(funnelCompletions, funnelStarts),
    emailOpens,
    emailClicks,
    stageCount,
    notes,
    fabricated: false,
    evidencePresent:
      funnelStarts != null ||
      funnelCompletions != null ||
      emailOpens != null ||
      emailClicks != null ||
      stageCount > 0,
  };
}

export function buildTrendAnalysis(snapshot: MetricSnapshot): TrendAnalysis {
  const prior = snapshot.priorPeriod ?? {};
  const pairs: Array<{ metric: string; current: number | null; prior: number | null }> = [
    { metric: "clicks", current: num(snapshot.clicks), prior: num(prior.clicks) },
    { metric: "conversions", current: num(snapshot.conversions), prior: num(prior.conversions) },
    {
      metric: "commissionAmount",
      current: num(snapshot.commissionAmount),
      prior: num(prior.commissionAmount),
    },
    {
      metric: "organicSessions",
      current: num(snapshot.organicSessions),
      prior: num(prior.organicSessions),
    },
  ];
  const trends = pairs.map((p) => ({
    metric: p.metric,
    direction: direction(p.current, p.prior),
    current: p.current,
    prior: p.prior,
    delta:
      p.current != null && p.prior != null
        ? Number((p.current - p.prior).toFixed(4))
        : null,
    evidencePresent: p.current != null || p.prior != null,
  }));
  const anomalies = trends
    .filter((t) => t.current != null && t.prior != null && t.prior !== 0)
    .filter((t) => Math.abs((t.delta ?? 0) / (t.prior as number)) >= 0.5)
    .map((t) => ({
      anomalyId: nextAssetId("anom"),
      metric: t.metric,
      severity: (Math.abs((t.delta ?? 0) / (t.prior as number)) >= 1
        ? "critical"
        : "watch") as "critical" | "watch",
      detail: `${t.metric} moved ${t.direction} by ${t.delta} vs prior period`,
      evidencePresent: true,
    }));
  const known = trends.filter((t) => t.direction !== "unknown");
  return {
    analysisId: nextAssetId("trend"),
    trends,
    anomalies,
    summary: known.length
      ? `Observed ${known.length} metric trend(s); ${anomalies.length} anomaly signal(s).`
      : "Insufficient prior-period evidence for trend analysis.",
    fabricated: false,
  };
}

export function buildOptimisationOpportunities(parts: {
  clicks: ClickMetrics;
  conversions: ConversionMetrics;
  commissions: CommissionSummary;
  seo: SeoPerformance;
  funnel: FunnelPerformance;
  trends: TrendAnalysis;
}): OptimisationOpportunity[] {
  const opportunities: OptimisationOpportunity[] = [];
  if (parts.clicks.evidencePresent && parts.clicks.ctr != null && parts.clicks.ctr < 0.02) {
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area: "clicks",
      recommendation: "Review creative/placement quality — observed CTR is low",
      rationale: `CTR=${parts.clicks.ctr} from evidenced clicks/impressions`,
      priority: "high",
      fabricated: false,
      evidencePresent: true,
    });
  }
  if (
    parts.conversions.evidencePresent &&
    parts.conversions.conversionRate != null &&
    parts.conversions.conversionRate < 0.01
  ) {
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area: "conversions",
      recommendation: "Inspect landing/offer fit — observed conversion rate is low",
      rationale: `conversionRate=${parts.conversions.conversionRate}`,
      priority: "high",
      fabricated: false,
      evidencePresent: true,
    });
  }
  if (parts.commissions.evidencePresent && parts.commissions.epc != null && parts.commissions.epc < 0.1) {
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area: "commissions",
      recommendation: "Revisit programme mix or traffic quality — observed EPC is low",
      rationale: `EPC=${parts.commissions.epc}`,
      priority: "medium",
      fabricated: false,
      evidencePresent: true,
    });
  }
  if (!parts.seo.evidencePresent) {
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area: "seo",
      recommendation: "Attach SEO performance fixtures for ranking/traffic measurement",
      rationale: "SEO metrics not evidenced in snapshot/SEO report",
      priority: "medium",
      fabricated: false,
      evidencePresent: false,
    });
  } else if (
    parts.seo.contentCompleteness != null &&
    parts.seo.contentCompleteness < 0.8
  ) {
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area: "content",
      recommendation: "Improve SEO content completeness before scaling traffic",
      rationale: `contentCompleteness=${parts.seo.contentCompleteness}`,
      priority: "medium",
      fabricated: false,
      evidencePresent: true,
    });
  }
  if (
    parts.funnel.evidencePresent &&
    parts.funnel.completionRate != null &&
    parts.funnel.completionRate < 0.1
  ) {
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area: "funnel",
      recommendation: "Tighten nurture/CTA stages — funnel completion rate is low",
      rationale: `completionRate=${parts.funnel.completionRate}`,
      priority: "high",
      fabricated: false,
      evidencePresent: true,
    });
  }
  for (const anomaly of parts.trends.anomalies) {
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area: "general",
      recommendation: `Investigate ${anomaly.metric} anomaly`,
      rationale: anomaly.detail,
      priority: anomaly.severity === "critical" ? "high" : "medium",
      fabricated: false,
      evidencePresent: anomaly.evidencePresent,
    });
  }
  for (const trend of parts.trends.trends) {
    if (
      trend.direction !== "down" ||
      !trend.evidencePresent ||
      trend.current == null ||
      trend.prior == null
    ) {
      continue;
    }
    const alreadyCovered = opportunities.some((o) =>
      o.rationale.includes(`${trend.metric} moved`),
    );
    if (alreadyCovered) continue;
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area:
        trend.metric === "conversions"
          ? "conversions"
          : trend.metric === "commissionAmount"
            ? "commissions"
            : trend.metric === "organicSessions"
              ? "seo"
              : "general",
      recommendation: `Address downward ${trend.metric} trend before scaling spend`,
      rationale: `${trend.metric} moved down by ${trend.delta} vs prior period (${trend.prior} → ${trend.current})`,
      priority: "medium",
      fabricated: false,
      evidencePresent: true,
    });
  }
  if (!opportunities.length) {
    opportunities.push({
      opportunityId: nextAssetId("opt"),
      area: "general",
      recommendation: "Continue monitoring — no high-priority evidenced gaps detected",
      rationale: "Available metrics did not trigger optimisation thresholds",
      priority: "low",
      fabricated: false,
      evidencePresent: true,
    });
  }
  return opportunities;
}

export function buildKpiDashboard(
  periodLabel: string,
  parts: {
    clicks: ClickMetrics;
    conversions: ConversionMetrics;
    commissions: CommissionSummary;
    revenue: RevenueSummary;
    seo: SeoPerformance;
    funnel: FunnelPerformance;
  },
): KpiDashboard {
  return {
    dashboardId: nextAssetId("kpi"),
    periodLabel,
    kpis: [
      {
        key: "clicks",
        label: "Clicks",
        value: parts.clicks.clicks,
        unit: "count",
        evidencePresent: parts.clicks.evidencePresent,
      },
      {
        key: "ctr",
        label: "CTR",
        value: parts.clicks.ctr,
        unit: "ratio",
        evidencePresent: parts.clicks.ctr != null,
      },
      {
        key: "conversions",
        label: "Conversions",
        value: parts.conversions.conversions,
        unit: "count",
        evidencePresent: parts.conversions.evidencePresent,
      },
      {
        key: "commission",
        label: "Commission",
        value: parts.commissions.commissionAmount,
        unit: parts.commissions.currency ?? "amount",
        evidencePresent: parts.commissions.evidencePresent,
      },
      {
        key: "epc",
        label: "EPC",
        value: parts.commissions.epc,
        unit: "amount_per_click",
        evidencePresent: parts.commissions.epc != null,
      },
      {
        key: "revenue",
        label: "Revenue",
        value: parts.revenue.revenueAmount,
        unit: parts.revenue.currency ?? "amount",
        evidencePresent: parts.revenue.evidencePresent,
      },
      {
        key: "organic_sessions",
        label: "Organic sessions",
        value: parts.seo.organicSessions,
        unit: "count",
        evidencePresent: parts.seo.organicSessions != null,
      },
      {
        key: "funnel_completion_rate",
        label: "Funnel completion rate",
        value: parts.funnel.completionRate,
        unit: "ratio",
        evidencePresent: parts.funnel.completionRate != null,
      },
    ],
    notes: [
      "KPI values reflect evidenced fixture/snapshot metrics only",
      "Null values mean not evidenced — never fabricated",
      "Analytics Worker never modifies campaigns automatically",
    ],
  };
}

export function computeConfidence(parts: {
  hasClicks: boolean;
  hasConversions: boolean;
  hasCommissions: boolean;
  hasSeo: boolean;
  hasFunnel: boolean;
  hasTrends: boolean;
  hasSourceLink: boolean;
}): number {
  const checks = [
    parts.hasClicks,
    parts.hasConversions,
    parts.hasCommissions,
    parts.hasSeo,
    parts.hasFunnel,
    parts.hasTrends,
    parts.hasSourceLink,
  ];
  return Number((checks.filter(Boolean).length / checks.length).toFixed(2));
}
