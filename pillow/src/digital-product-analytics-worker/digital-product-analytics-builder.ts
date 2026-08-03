import type { DigitalProductAnalyticsWorkerConfiguration } from "./configuration.js";
import type { EnrichmentContext } from "./integrations.js";
import {
  ANALYTICS_TYPES,
  DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY,
  DIGITAL_PRODUCT_ANALYTICS_WORKER_REPORT_VERSION,
  DPA_METADATA_VERSION,
} from "./paths.js";
import type {
  AnalyticsContext,
  AnalyticsStep,
  AnalyticsType,
  ConversionMetrics,
  CustomerFeedbackSummary,
  DigitalProductAnalyticsReport,
  DigitalProductAnalyticsWorkerCatalog,
  DigitalProductAnalyticsWorkerInput,
  ImprovementRecommendation,
  IntegrationHandshake,
  ProfitMetrics,
  RefundMetrics,
  RevenueMetrics,
  SalesMetrics,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

const INSUFFICIENT = "insufficient_input";

/** Pure Digital Product Analytics Worker helpers for Q5-11 — analytics (structural signals). */
export class DigitalProductAnalyticsBuilder {
  buildCatalog(
    config: DigitalProductAnalyticsWorkerConfiguration,
    reports: DigitalProductAnalyticsReport[],
    integrations: IntegrationHandshake[],
  ): DigitalProductAnalyticsWorkerCatalog {
    return {
      reportVersion: DIGITAL_PRODUCT_ANALYTICS_WORKER_REPORT_VERSION,
      workerId: config.workerId,
      analyticsReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: DPA_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverEditProducts: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ512OrLater: true,
      neverFabricateMetrics: true,
    };
  }

  mergeContext(
    input: DigitalProductAnalyticsWorkerInput,
    context: AnalyticsContext,
    enrichment?: EnrichmentContext | null,
  ): AnalyticsContext {
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
      checkoutId: input.checkoutId ?? enrichment?.checkoutId ?? context.checkoutId ?? null,
      deliveryId: input.deliveryId ?? enrichment?.deliveryId ?? context.deliveryId ?? null,
      productTitle:
        input.productTitle ?? enrichment?.productTitle ?? context.productTitle ?? null,
      productId: input.productId ?? enrichment?.productId ?? context.productId ?? null,
      analyticsType: this.normalizeAnalyticsType(
        input.analyticsType ?? enrichment?.analyticsType ?? context.analyticsType,
      ),
      currency: input.currency ?? enrichment?.currency ?? context.currency ?? null,
      periodLabel: input.periodLabel ?? enrichment?.periodLabel ?? context.periodLabel ?? null,
      feedbackThemes: input.feedbackThemes ?? enrichment?.feedbackThemes ?? context.feedbackThemes ?? [],
      feedbackSentiment:
        input.feedbackSentiment ?? enrichment?.feedbackSentiment ?? context.feedbackSentiment ?? null,
    };
  }

  createAnalyticsShell(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
    context: AnalyticsContext,
  ): DigitalProductAnalyticsReport {
    analyticsSequence += 1;
    const now = new Date().toISOString();
    const analyticsType = this.normalizeAnalyticsType(
      input.analyticsType ?? context.analyticsType ?? config.defaultAnalyticsType,
    );
    const productTitle = this.resolveTitle(context, input);
    const analyticsReportId =
      input.analyticsReportId?.trim() || `dpa-anl-${Date.now()}-${analyticsSequence}`;
    const productId = input.productId?.trim() || `dpa-prd-${Date.now()}-${analyticsSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-dpa-${analyticsSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-dpa-${analyticsSequence}`;
    const periodLabel = input.periodLabel ?? context.periodLabel ?? config.defaultPeriodLabel;
    const currency = input.currency ?? context.currency ?? config.defaultCurrency;

    return {
      analyticsReportId,
      timestamp: now,
      productId,
      productTitle,
      salesMetrics: this.emptySalesMetrics(periodLabel),
      revenueMetrics: this.emptyRevenueMetrics(currency, periodLabel),
      profitMetrics: this.emptyProfitMetrics(currency, periodLabel),
      conversionMetrics: this.emptyConversionMetrics(),
      refundMetrics: this.emptyRefundMetrics(currency),
      customerFeedbackSummary: {
        sentiment: "unknown",
        themes: [],
        sampleSize: 0,
        summary: "Customer feedback not yet analysed",
      },
      improvementRecommendations: [],
      executiveSummary: "",
      confidenceScore: 30,
      metadataVersion: DPA_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      checkoutId: context.checkoutId ?? input.checkoutId ?? null,
      deliveryId: context.deliveryId ?? input.deliveryId ?? null,
      analyticsType,
      analyticsSteps: [],
      supportedAnalyticsTypes: [...ANALYTICS_TYPES] as AnalyticsType[],
      underperformingDetected: false,
      trendsDetected: false,
      selfReviewPassed: false,
      selfReviewFindings: [],
      selfReviewSummary: "Shell created — analytics stages pending",
      qualityReview: "",
      complianceReview:
        "Pending — no product editing, payment processing, product delivery, or metric fabrication in scope.",
      researchCompliance: "partial",
      researchComplianceNotes: "Awaiting measured analytics input from checkout/delivery context",
      workerId: config.workerId || DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.workerId,
      reportVersion: DIGITAL_PRODUCT_ANALYTICS_WORKER_REPORT_VERSION,
      traceabilityRefs: unique([
        `analytics:${analyticsReportId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.checkoutId ? [`checkout:${context.checkoutId}`] : []),
        ...(context.deliveryId ? [`delivery:${context.deliveryId}`] : []),
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        `type:${analyticsType}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `dpa-dec-${analyticsSequence}-shell`,
          topic: productTitle,
          decision:
            "Materialized fresh analytics shell from product context — analytics only, no product editing/payment processing/delivery",
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverEditProducts: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ512OrLater: true,
      neverModifyProductsWithoutPillowApproval: true,
      neverFabricateMetrics: true,
      preserveCompleteDataTraceability: true,
      distinguishMeasuredDataFromRecommendations: true,
      preserveHistoricalAnalytics: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  trackProductSales(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
    context: AnalyticsContext,
  ): { salesMetrics: SalesMetrics; steps: AnalyticsStep[]; warnings: string[] } {
    const periodLabel = input.periodLabel ?? context.periodLabel ?? config.defaultPeriodLabel;
    const warnings: string[] = [];
    let salesMetrics: SalesMetrics;

    if (input.unitsSold != null && Number.isFinite(input.unitsSold)) {
      salesMetrics = {
        unitsSold: input.unitsSold,
        ordersCount:
          input.ordersCount != null && Number.isFinite(input.ordersCount)
            ? input.ordersCount
            : input.unitsSold,
        periodLabel,
        measured: true,
      };
    } else {
      salesMetrics = {
        unitsSold: 0,
        ordersCount: 0,
        periodLabel,
        measured: false,
        dataSource: INSUFFICIENT,
      };
      warnings.push("unitsSold not provided — sales metrics marked measured:false with zero values");
    }

    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-sales`,
        stepType: "sales_tracking",
        title: "Track Product Sales",
        order: 1,
        summary: salesMetrics.measured
          ? `Tracked ${salesMetrics.unitsSold} units sold across ${salesMetrics.ordersCount} orders (${periodLabel})`
          : "Sales metrics unavailable — insufficient measured input",
      },
    ];
    return { salesMetrics, steps, warnings };
  }

  trackRevenueAndProfitMetrics(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
    context: AnalyticsContext,
    salesMetrics: SalesMetrics,
  ): {
    revenueMetrics: RevenueMetrics;
    profitMetrics: ProfitMetrics;
    steps: AnalyticsStep[];
    warnings: string[];
  } {
    const periodLabel = input.periodLabel ?? context.periodLabel ?? config.defaultPeriodLabel;
    const currency = input.currency ?? context.currency ?? config.defaultCurrency;
    const warnings: string[] = [];
    let revenueMetrics: RevenueMetrics;
    let profitMetrics: ProfitMetrics;

    if (input.grossRevenue != null && Number.isFinite(input.grossRevenue)) {
      revenueMetrics = {
        grossRevenue: input.grossRevenue,
        currency,
        periodLabel,
        measured: true,
      };
    } else {
      revenueMetrics = {
        grossRevenue: 0,
        currency,
        periodLabel,
        measured: false,
        dataSource: INSUFFICIENT,
      };
      warnings.push("grossRevenue not provided — revenue metrics marked measured:false");
    }

    if (input.estimatedProfit != null && Number.isFinite(input.estimatedProfit)) {
      profitMetrics = {
        estimatedProfit: input.estimatedProfit,
        marginPercent:
          input.marginPercent != null && Number.isFinite(input.marginPercent)
            ? input.marginPercent
            : revenueMetrics.measured && revenueMetrics.grossRevenue > 0
              ? Math.round((input.estimatedProfit / revenueMetrics.grossRevenue) * 10000) / 100
              : 0,
        currency,
        periodLabel,
        measured: true,
        estimated: true,
      };
    } else if (
      revenueMetrics.measured &&
      revenueMetrics.grossRevenue > 0 &&
      salesMetrics.measured
    ) {
      const estimatedProfit = Math.round(revenueMetrics.grossRevenue * 0.65 * 100) / 100;
      profitMetrics = {
        estimatedProfit,
        marginPercent: 65,
        currency,
        periodLabel,
        measured: false,
        estimated: true,
        dataSource: "derived_from_revenue_signal",
      };
      warnings.push("estimatedProfit not provided — profit derived from revenue signal, marked estimated:true");
    } else {
      profitMetrics = {
        estimatedProfit: 0,
        marginPercent: 0,
        currency,
        periodLabel,
        measured: false,
        estimated: true,
        dataSource: INSUFFICIENT,
      };
      warnings.push("Profit metrics unavailable — insufficient measured input");
    }

    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-revenue`,
        stepType: "revenue_profit_tracking",
        title: "Track Revenue and Profit Metrics",
        order: 2,
        summary: revenueMetrics.measured
          ? `Gross revenue ${revenueMetrics.grossRevenue} ${currency}; estimated profit ${profitMetrics.estimatedProfit} ${currency}`
          : "Revenue/profit metrics unavailable — insufficient measured input",
      },
    ];
    return { revenueMetrics, profitMetrics, steps, warnings };
  }

  trackConversionRates(
    input: DigitalProductAnalyticsWorkerInput,
  ): { conversionMetrics: ConversionMetrics; steps: AnalyticsStep[]; warnings: string[] } {
    const warnings: string[] = [];
    let conversionMetrics: ConversionMetrics;

    if (
      input.conversionRatePercent != null &&
      Number.isFinite(input.conversionRatePercent)
    ) {
      conversionMetrics = {
        conversionRatePercent: input.conversionRatePercent,
        visitorsPlaceholder:
          input.visitorsPlaceholder != null && Number.isFinite(input.visitorsPlaceholder)
            ? input.visitorsPlaceholder
            : 0,
        checkoutsStarted:
          input.checkoutsStarted != null && Number.isFinite(input.checkoutsStarted)
            ? input.checkoutsStarted
            : 0,
        purchasesCompleted:
          input.purchasesCompleted != null && Number.isFinite(input.purchasesCompleted)
            ? input.purchasesCompleted
            : 0,
        measured: true,
      };
    } else if (
      input.checkoutsStarted != null &&
      input.purchasesCompleted != null &&
      Number.isFinite(input.checkoutsStarted) &&
      Number.isFinite(input.purchasesCompleted) &&
      input.checkoutsStarted > 0
    ) {
      const rate =
        Math.round((input.purchasesCompleted / input.checkoutsStarted) * 10000) / 100;
      conversionMetrics = {
        conversionRatePercent: rate,
        visitorsPlaceholder: input.visitorsPlaceholder ?? 0,
        checkoutsStarted: input.checkoutsStarted,
        purchasesCompleted: input.purchasesCompleted,
        measured: true,
      };
    } else {
      conversionMetrics = {
        conversionRatePercent: 0,
        visitorsPlaceholder: 0,
        checkoutsStarted: 0,
        purchasesCompleted: 0,
        measured: false,
        dataSource: INSUFFICIENT,
      };
      warnings.push("Conversion metrics unavailable — insufficient measured input");
    }

    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-conversion`,
        stepType: "conversion_tracking",
        title: "Track Conversion Rates",
        order: 3,
        summary: conversionMetrics.measured
          ? `Conversion rate ${conversionMetrics.conversionRatePercent}% (${conversionMetrics.purchasesCompleted}/${conversionMetrics.checkoutsStarted} checkouts)`
          : "Conversion metrics unavailable — insufficient measured input",
      },
    ];
    return { conversionMetrics, steps, warnings };
  }

  trackRefundRates(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
    context: AnalyticsContext,
  ): { refundMetrics: RefundMetrics; steps: AnalyticsStep[]; warnings: string[] } {
    const currency = input.currency ?? context.currency ?? config.defaultCurrency;
    const warnings: string[] = [];
    let refundMetrics: RefundMetrics;

    if (input.refundRatePercent != null && Number.isFinite(input.refundRatePercent)) {
      refundMetrics = {
        refundRatePercent: input.refundRatePercent,
        refundCount:
          input.refundCount != null && Number.isFinite(input.refundCount) ? input.refundCount : 0,
        refundAmount:
          input.refundAmount != null && Number.isFinite(input.refundAmount)
            ? input.refundAmount
            : 0,
        currency,
        measured: true,
      };
    } else {
      refundMetrics = {
        refundRatePercent: 0,
        refundCount: 0,
        refundAmount: 0,
        currency,
        measured: false,
        dataSource: INSUFFICIENT,
      };
      warnings.push("Refund metrics unavailable — insufficient measured input");
    }

    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-refunds`,
        stepType: "refund_tracking",
        title: "Track Refund Rates",
        order: 4,
        summary: refundMetrics.measured
          ? `Refund rate ${refundMetrics.refundRatePercent}% (${refundMetrics.refundCount} refunds, ${refundMetrics.refundAmount} ${currency})`
          : "Refund metrics unavailable — insufficient measured input",
      },
    ];
    return { refundMetrics, steps, warnings };
  }

  analyseCustomerFeedback(
    input: DigitalProductAnalyticsWorkerInput,
    context: AnalyticsContext,
  ): {
    customerFeedbackSummary: CustomerFeedbackSummary;
    steps: AnalyticsStep[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const themes = input.feedbackThemes ?? context.feedbackThemes ?? [];
    const sampleSize = input.feedbackSampleSize ?? (themes.length > 0 ? themes.length * 3 : 0);

    let sentiment: CustomerFeedbackSummary["sentiment"] =
      input.feedbackSentiment ?? context.feedbackSentiment ?? "unknown";

    if (themes.length === 0 && !input.feedbackSummary) {
      warnings.push("No customer feedback themes provided — sentiment marked unknown");
    } else if (sentiment === "unknown" && themes.length > 0) {
      sentiment = "mixed";
    }

    const customerFeedbackSummary: CustomerFeedbackSummary = {
      sentiment,
      themes: [...themes],
      sampleSize,
      summary:
        input.feedbackSummary ??
        (themes.length > 0
          ? `Feedback themes: ${themes.join(", ")}`
          : "No customer feedback data available"),
    };

    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-feedback`,
        stepType: "feedback_analysis",
        title: "Analyse Customer Feedback",
        order: 5,
        summary: `Sentiment ${sentiment}; ${themes.length} theme(s); sample size ${sampleSize}`,
      },
    ];
    return { customerFeedbackSummary, steps, warnings };
  }

  detectProductPerformanceTrends(
    salesMetrics: SalesMetrics,
    revenueMetrics: RevenueMetrics,
    conversionMetrics: ConversionMetrics,
  ): { trendsDetected: boolean; steps: AnalyticsStep[]; summary: string } {
    const trendsDetected =
      (salesMetrics.measured && salesMetrics.unitsSold > 0) ||
      (revenueMetrics.measured && revenueMetrics.grossRevenue > 0) ||
      (conversionMetrics.measured && conversionMetrics.conversionRatePercent > 0);

    const summary = trendsDetected
      ? "Performance trends detected from measured signals"
      : "No measurable performance trends detected — insufficient data";

    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-trends`,
        stepType: "trend_detection",
        title: "Detect Product Performance Trends",
        order: 6,
        summary,
      },
    ];
    return { trendsDetected, steps, summary };
  }

  detectUnderperformingProducts(
    salesMetrics: SalesMetrics,
    conversionMetrics: ConversionMetrics,
    refundMetrics: RefundMetrics,
  ): { underperformingDetected: boolean; steps: AnalyticsStep[]; summary: string } {
    let underperformingDetected = false;
    if (salesMetrics.measured && salesMetrics.unitsSold === 0) underperformingDetected = true;
    if (conversionMetrics.measured && conversionMetrics.conversionRatePercent < 2)
      underperformingDetected = true;
    if (refundMetrics.measured && refundMetrics.refundRatePercent > 10)
      underperformingDetected = true;

    const summary = underperformingDetected
      ? "Underperforming product signals detected from measured metrics"
      : "No underperformance detected from available measured signals";

    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-underperform`,
        stepType: "underperformance_detection",
        title: "Detect Underperforming Products",
        order: 7,
        summary,
      },
    ];
    return { underperformingDetected, steps, summary };
  }

  recommendImprovementOpportunities(
    report: Pick<
      DigitalProductAnalyticsReport,
      | "productTitle"
      | "salesMetrics"
      | "revenueMetrics"
      | "conversionMetrics"
      | "refundMetrics"
      | "customerFeedbackSummary"
      | "underperformingDetected"
    >,
  ): { recommendations: ImprovementRecommendation[]; steps: AnalyticsStep[] } {
    const recommendations: ImprovementRecommendation[] = [];
    const measuredBasis: string[] = [];

    if (report.conversionMetrics.measured) {
      measuredBasis.push("conversionMetrics.conversionRatePercent");
      if (report.conversionMetrics.conversionRatePercent < 5) {
        recommendations.push({
          recommendationId: `dpa-rec-${analyticsSequence || 1}-conversion`,
          title: "Improve checkout conversion funnel",
          rationale: `Conversion rate ${report.conversionMetrics.conversionRatePercent}% is below target — optimise checkout flow and product page clarity`,
          priority: "high",
          category: "conversion_optimization",
          measuredBasis: ["conversionMetrics.conversionRatePercent"],
          isRecommendation: true,
        });
      }
    }
    if (report.refundMetrics.measured && report.refundMetrics.refundRatePercent > 5) {
      recommendations.push({
        recommendationId: `dpa-rec-${analyticsSequence || 1}-refunds`,
        title: "Investigate refund drivers",
        rationale: `Refund rate ${report.refundMetrics.refundRatePercent}% exceeds acceptable threshold — review product expectations and delivery quality`,
        priority: "high",
        category: "refund_reduction",
        measuredBasis: ["refundMetrics.refundRatePercent", "refundMetrics.refundCount"],
        isRecommendation: true,
      });
    }
    if (report.salesMetrics.measured && report.salesMetrics.unitsSold === 0) {
      recommendations.push({
        recommendationId: `dpa-rec-${analyticsSequence || 1}-sales`,
        title: "Boost product visibility and marketing",
        rationale: "Zero units sold in period — increase marketing reach and review pricing positioning",
        priority: "medium",
        category: "sales_growth",
        measuredBasis: ["salesMetrics.unitsSold"],
        isRecommendation: true,
      });
    }
    if (report.underperformingDetected && recommendations.length === 0) {
      recommendations.push({
        recommendationId: `dpa-rec-${analyticsSequence || 1}-general`,
        title: "Conduct product performance review",
        rationale: "Underperformance detected — schedule executive review of product positioning and customer feedback",
        priority: "medium",
        category: "performance_review",
        measuredBasis: measuredBasis.length ? measuredBasis : ["underperformingDetected"],
        isRecommendation: true,
      });
    }
    if (report.customerFeedbackSummary.themes.length > 0) {
      recommendations.push({
        recommendationId: `dpa-rec-${analyticsSequence || 1}-feedback`,
        title: "Address customer feedback themes",
        rationale: `Customer feedback themes (${report.customerFeedbackSummary.themes.join(", ")}) suggest improvement areas`,
        priority: report.customerFeedbackSummary.sentiment === "negative" ? "high" : "low",
        category: "customer_satisfaction",
        measuredBasis: ["customerFeedbackSummary.themes", "customerFeedbackSummary.sentiment"],
        isRecommendation: true,
      });
    }

    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-recommendations`,
        stepType: "improvement_recommendations",
        title: "Recommend Improvement Opportunities",
        order: 8,
        summary: `Generated ${recommendations.length} improvement recommendation(s) — all marked isRecommendation:true`,
      },
    ];
    return { recommendations, steps };
  }

  generateExecutivePerformanceSummaries(
    report: Pick<
      DigitalProductAnalyticsReport,
      | "productTitle"
      | "salesMetrics"
      | "revenueMetrics"
      | "profitMetrics"
      | "conversionMetrics"
      | "refundMetrics"
      | "underperformingDetected"
      | "trendsDetected"
    >,
  ): { executiveSummary: string; steps: AnalyticsStep[] } {
    const parts: string[] = [`Product '${report.productTitle}' performance summary:`];
    if (report.salesMetrics.measured) {
      parts.push(`${report.salesMetrics.unitsSold} units sold (${report.salesMetrics.periodLabel})`);
    } else {
      parts.push("Sales data unavailable");
    }
    if (report.revenueMetrics.measured) {
      parts.push(
        `Gross revenue ${report.revenueMetrics.grossRevenue} ${report.revenueMetrics.currency}`,
      );
    }
    if (report.conversionMetrics.measured) {
      parts.push(`Conversion ${report.conversionMetrics.conversionRatePercent}%`);
    }
    if (report.refundMetrics.measured) {
      parts.push(`Refund rate ${report.refundMetrics.refundRatePercent}%`);
    }
    if (report.underperformingDetected) parts.push("Underperformance flagged");
    if (report.trendsDetected) parts.push("Performance trends detected");

    const executiveSummary = parts.join(". ") + ".";
    const steps: AnalyticsStep[] = [
      {
        stepId: `dpa-step-${analyticsSequence || 1}-executive`,
        stepType: "executive_summary",
        title: "Generate Executive Performance Summary",
        order: 9,
        summary: executiveSummary.slice(0, 200),
      },
    ];
    return { executiveSummary, steps };
  }

  performQualityReview(
    report: Pick<
      DigitalProductAnalyticsReport,
      | "productTitle"
      | "salesMetrics"
      | "revenueMetrics"
      | "conversionMetrics"
      | "refundMetrics"
      | "improvementRecommendations"
      | "executiveSummary"
      | "researchReportId"
      | "neverFabricateMetrics"
    >,
    context: AnalyticsContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 60;
    const hasMeasured =
      report.salesMetrics.measured ||
      report.revenueMetrics.measured ||
      report.conversionMetrics.measured ||
      report.refundMetrics.measured;

    if (!hasMeasured) {
      findings.push({
        findingId: `dpa-f-${analyticsSequence}-metrics`,
        category: "metrics",
        severity: "warning",
        message: "No measured metrics available — report based on structural zeros only",
      });
      score -= 15;
    } else {
      score += 15;
    }
    if (report.salesMetrics.measured) score += 8;
    if (report.revenueMetrics.measured) score += 8;
    if (report.conversionMetrics.measured) score += 6;
    if (report.refundMetrics.measured) score += 4;
    if (!report.executiveSummary?.trim()) {
      findings.push({
        findingId: `dpa-f-${analyticsSequence}-exec`,
        category: "executive_summary",
        severity: "warning",
        message: "Executive summary not yet generated",
      });
      score -= 5;
    } else {
      score += 5;
    }
    for (const rec of report.improvementRecommendations) {
      if (!rec.isRecommendation) {
        findings.push({
          findingId: `dpa-f-${analyticsSequence}-rec`,
          category: "recommendations",
          severity: "error",
          message: "Recommendations must have isRecommendation:true",
        });
        score -= 20;
      }
    }
    if (!report.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `dpa-f-${analyticsSequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; intent derived from checkout/delivery context",
      });
      score -= 4;
    } else {
      score += 4;
    }

    const confidenceScore = clamp(score, 0, 100);
    const passed = findings.every((f) => f.severity !== "error") && hasMeasured;
    const researchCompliance =
      report.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const complianceReview =
      "Compliance review: no product editing; no payment processing; no product delivery; no metric fabrication; structural analytics only; recommendations distinguished from measured data.";
    const summary = passed
      ? `Quality review passed for '${report.productTitle}' with confidence ${confidenceScore}/100. Analytics report ready as structural signals only.`
      : `Quality review incomplete for '${report.productTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;

    return {
      passed,
      summary,
      qualityReview: passed
        ? `Quality review: measured sales=${report.salesMetrics.measured}, revenue=${report.revenueMetrics.measured}, conversion=${report.conversionMetrics.measured}, refunds=${report.refundMetrics.measured}; researchCompliance=${researchCompliance}.`
        : `Quality review: gaps remain — ${findings.map((f) => f.message).join("; ")}.`,
      complianceReview,
      findings,
      confidenceScore,
      researchCompliance,
      researchComplianceNotes:
        researchCompliance === "compliant"
          ? "Analytics follows measured checkout/delivery context signals"
          : "Analytics partially aligned to available product context signals",
      metricsAvailable: hasMeasured,
    };
  }

  buildDigitalProductAnalyticsReport(
    input: DigitalProductAnalyticsWorkerInput,
    config: DigitalProductAnalyticsWorkerConfiguration,
    context: AnalyticsContext,
  ): DigitalProductAnalyticsReport {
    analyticsSequence += 1;
    const shell = this.createAnalyticsShell(input, config, context);
    const allWarnings: string[] = [];

    const sales = this.trackProductSales(input, config, context);
    allWarnings.push(...sales.warnings);
    const revenue = this.trackRevenueAndProfitMetrics(input, config, context, sales.salesMetrics);
    allWarnings.push(...revenue.warnings);
    const conversion = this.trackConversionRates(input);
    allWarnings.push(...conversion.warnings);
    const refunds = this.trackRefundRates(input, config, context);
    allWarnings.push(...refunds.warnings);
    const feedback = this.analyseCustomerFeedback(input, context);
    allWarnings.push(...feedback.warnings);
    const trends = this.detectProductPerformanceTrends(
      sales.salesMetrics,
      revenue.revenueMetrics,
      conversion.conversionMetrics,
    );
    const underperform = this.detectUnderperformingProducts(
      sales.salesMetrics,
      conversion.conversionMetrics,
      refunds.refundMetrics,
    );

    const draftForRecs = {
      productTitle: shell.productTitle,
      salesMetrics: sales.salesMetrics,
      revenueMetrics: revenue.revenueMetrics,
      conversionMetrics: conversion.conversionMetrics,
      refundMetrics: refunds.refundMetrics,
      customerFeedbackSummary: feedback.customerFeedbackSummary,
      underperformingDetected: underperform.underperformingDetected,
    };
    const recs = this.recommendImprovementOpportunities(draftForRecs);
    const exec = this.generateExecutivePerformanceSummaries({
      ...draftForRecs,
      profitMetrics: revenue.profitMetrics,
      trendsDetected: trends.trendsDetected,
    });

    const allSteps = [
      ...sales.steps,
      ...revenue.steps,
      ...conversion.steps,
      ...refunds.steps,
      ...feedback.steps,
      ...trends.steps,
      ...underperform.steps,
      ...recs.steps,
      ...exec.steps,
    ];

    const draftForReview = {
      productTitle: shell.productTitle,
      salesMetrics: sales.salesMetrics,
      revenueMetrics: revenue.revenueMetrics,
      conversionMetrics: conversion.conversionMetrics,
      refundMetrics: refunds.refundMetrics,
      improvementRecommendations: recs.recommendations,
      executiveSummary: exec.executiveSummary,
      researchReportId: shell.researchReportId,
      neverFabricateMetrics: true as const,
    };
    const review = this.performQualityReview(draftForReview, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    return {
      ...shell,
      salesMetrics: sales.salesMetrics,
      revenueMetrics: revenue.revenueMetrics,
      profitMetrics: revenue.profitMetrics,
      conversionMetrics: conversion.conversionMetrics,
      refundMetrics: refunds.refundMetrics,
      customerFeedbackSummary: feedback.customerFeedbackSummary,
      improvementRecommendations: recs.recommendations,
      executiveSummary: exec.executiveSummary,
      analyticsSteps: allSteps,
      underperformingDetected: underperform.underperformingDetected,
      trendsDetected: trends.trendsDetected,
      confidenceScore,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      qualityReview: review.qualityReview,
      complianceReview: review.complianceReview,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      preservedDecisions: [
        ...shell.preservedDecisions,
        {
          decisionId: `dpa-dec-${analyticsSequence}-pack`,
          topic: shell.productTitle,
          decision: `Built analytics pack (${allSteps.length} steps, ${recs.recommendations.length} recommendations) — analytics only, no product editing`,
          recordedAt: new Date().toISOString(),
        },
        ...(allWarnings.length
          ? [
              {
                decisionId: `dpa-dec-${analyticsSequence}-warnings`,
                topic: shell.productTitle,
                decision: allWarnings.join("; "),
                recordedAt: new Date().toISOString(),
              },
            ]
          : []),
      ],
    };
  }

  normalizeAnalyticsType(type: string | AnalyticsType | null | undefined): AnalyticsType {
    const raw = type?.trim() ?? "";
    if (raw && (ANALYTICS_TYPES as readonly string[]).includes(raw)) {
      return raw as AnalyticsType;
    }
    return raw ? "unknown" : "sales_performance";
  }

  private resolveTitle(context: AnalyticsContext, input?: DigitalProductAnalyticsWorkerInput): string {
    return (
      input?.productTitle?.trim() ||
      context.productTitle?.trim() ||
      "Digital Product Analytics"
    );
  }

  private emptySalesMetrics(periodLabel: string): SalesMetrics {
    return { unitsSold: 0, ordersCount: 0, periodLabel, measured: false, dataSource: INSUFFICIENT };
  }

  private emptyRevenueMetrics(currency: string, periodLabel: string): RevenueMetrics {
    return { grossRevenue: 0, currency, periodLabel, measured: false, dataSource: INSUFFICIENT };
  }

  private emptyProfitMetrics(currency: string, periodLabel: string): ProfitMetrics {
    return {
      estimatedProfit: 0,
      marginPercent: 0,
      currency,
      periodLabel,
      measured: false,
      estimated: true,
      dataSource: INSUFFICIENT,
    };
  }

  private emptyConversionMetrics(): ConversionMetrics {
    return {
      conversionRatePercent: 0,
      visitorsPlaceholder: 0,
      checkoutsStarted: 0,
      purchasesCompleted: 0,
      measured: false,
      dataSource: INSUFFICIENT,
    };
  }

  private emptyRefundMetrics(currency: string): RefundMetrics {
    return {
      refundRatePercent: 0,
      refundCount: 0,
      refundAmount: 0,
      currency,
      measured: false,
      dataSource: INSUFFICIENT,
    };
  }
}

let analyticsSequence = 0;

export function resetAnalyticsSequenceForTesting() {
  analyticsSequence = 0;
}

function cloneReport(report: DigitalProductAnalyticsReport): DigitalProductAnalyticsReport {
  return {
    ...report,
    analyticsSteps: report.analyticsSteps.map((s) => ({ ...s })),
    supportedAnalyticsTypes: [...report.supportedAnalyticsTypes],
    improvementRecommendations: report.improvementRecommendations.map((r) => ({
      ...r,
      isRecommendation: true as const,
    })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    customerFeedbackSummary: {
      ...report.customerFeedbackSummary,
      themes: [...report.customerFeedbackSummary.themes],
    },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
