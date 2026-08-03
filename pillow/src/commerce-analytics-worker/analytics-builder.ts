import type { CommerceAnalyticsWorkerConfiguration } from "./configuration.js";
import type { CommerceEnrichmentContext } from "./integrations.js";
import {
  CAW_METADATA_VERSION,
  COMMERCE_ANALYTICS_REPORT_VERSION,
  COMMERCE_ANALYTICS_WORKER_IDENTITY,
} from "./paths.js";
import type {
  AnalyticsContextInput,
  CommerceAnalyticsReport,
  CommerceAnalyticsWorkerCatalog,
  CommerceAnalyticsWorkerInput,
  EvidenceItem,
  ExecutiveRecommendation,
  ImprovementOpportunity,
  IntegrationHandshake,
  MetricKind,
  MetricValue,
  ProductPerformanceClassification,
  SignificantChange,
} from "./types.js";

/** Pure Commerce Analytics Worker helpers for Q3-13 — intelligence only. */
export class AnalyticsBuilder {
  buildCatalog(
    config: CommerceAnalyticsWorkerConfiguration,
    reports: CommerceAnalyticsReport[],
    integrations: IntegrationHandshake[],
  ): CommerceAnalyticsWorkerCatalog {
    return {
      reportVersion: COMMERCE_ANALYTICS_REPORT_VERSION,
      workerId: config.workerId,
      analyticsReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: CAW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverModifyProducts: true,
      neverModifyPricing: true,
      neverModifySuppliers: true,
      neverExecuteOptimizations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverModifyOperationalData: true,
    };
  }

  resolveContext(input: CommerceAnalyticsWorkerInput): AnalyticsContextInput {
    const base = input.analyticsContext ?? {};
    return {
      businessId: input.businessId ?? base.businessId,
      productId: input.productId ?? base.productId,
      productName: input.productName ?? base.productName,
      supplierId: input.supplierId ?? base.supplierId,
      supplierName: input.supplierName ?? base.supplierName,
      unitsSold: input.unitsSold ?? base.unitsSold,
      revenue: input.revenue ?? base.revenue,
      sessions: input.sessions ?? base.sessions,
      orders: input.orders ?? base.orders,
      averageOrderValue: input.averageOrderValue ?? base.averageOrderValue,
      grossProfit: input.grossProfit ?? base.grossProfit,
      netProfit: input.netProfit ?? base.netProfit,
      costOfGoods: input.costOfGoods ?? base.costOfGoods,
      customerIssueCount: input.customerIssueCount ?? base.customerIssueCount,
      refundCount: input.refundCount ?? base.refundCount,
      refundAmount: input.refundAmount ?? base.refundAmount,
      onTimeFulfilments: input.onTimeFulfilments ?? base.onTimeFulfilments,
      totalFulfilments: input.totalFulfilments ?? base.totalFulfilments,
      fulfilmentFailures: input.fulfilmentFailures ?? base.fulfilmentFailures,
      currentStock: input.currentStock ?? base.currentStock,
      reorderPoint: input.reorderPoint ?? base.reorderPoint,
      recommendedSellingPrice:
        input.recommendedSellingPrice ?? base.recommendedSellingPrice,
      landedCost: input.landedCost ?? base.landedCost,
      targetMargin: input.targetMargin ?? base.targetMargin,
      previousUnitsSold: input.previousUnitsSold ?? base.previousUnitsSold,
      previousRevenue: input.previousRevenue ?? base.previousRevenue,
      previousConversionRate:
        input.previousConversionRate ?? base.previousConversionRate,
      previousNetProfit: input.previousNetProfit ?? base.previousNetProfit,
      previousRefundRate: input.previousRefundRate ?? base.previousRefundRate,
      periodLabel: input.periodLabel ?? base.periodLabel,
      pricingReportId: input.pricingReportId ?? base.pricingReportId,
      inventoryReportId: input.inventoryReportId ?? base.inventoryReportId,
      orderReportIds: input.orderReportIds ?? base.orderReportIds,
      refundCaseIds: input.refundCaseIds ?? base.refundCaseIds,
      businessMissionId: input.businessMissionId ?? base.businessMissionId,
    };
  }

  buildReport(
    input: CommerceAnalyticsWorkerInput,
    config: CommerceAnalyticsWorkerConfiguration,
    context: AnalyticsContextInput,
    enrichment?: CommerceEnrichmentContext | null,
  ): CommerceAnalyticsReport {
    analyticsSequence += 1;
    const now = new Date().toISOString();
    const analyticsReportId =
      input.analyticsReportId?.trim() ||
      `caw-anl-${Date.now()}-${analyticsSequence}`;

    const businessId =
      context.businessId?.trim() ||
      enrichment?.businessId?.trim() ||
      context.businessMissionId?.trim() ||
      enrichment?.businessMissionId?.trim() ||
      `biz-caw-${analyticsSequence}`;
    const productId =
      context.productId?.trim() ||
      enrichment?.productId?.trim() ||
      `prod-caw-${analyticsSequence}`;
    const productName =
      context.productName?.trim() ||
      enrichment?.productName?.trim() ||
      productId;
    const supplierId =
      context.supplierId?.trim() || enrichment?.supplierId?.trim() || null;
    const supplierName =
      context.supplierName?.trim() || enrichment?.supplierName?.trim() || null;
    const periodLabel =
      context.periodLabel?.trim() || config.defaultPeriodLabel || "current_period";

    const pricingReportId =
      context.pricingReportId?.trim() ||
      enrichment?.pricingReportId?.trim() ||
      null;
    const inventoryReportId =
      context.inventoryReportId?.trim() ||
      enrichment?.inventoryReportId?.trim() ||
      null;
    const orderReportIds = uniqueIds([
      ...(context.orderReportIds ?? []),
      ...(enrichment?.orderReportIds ?? []),
    ]);
    const refundCaseIds = uniqueIds([
      ...(context.refundCaseIds ?? []),
      ...(enrichment?.refundCaseIds ?? []),
    ]);

    const sales = this.buildSalesMetrics(context, enrichment, periodLabel);
    const conversion = this.buildConversionMetrics(context, enrichment, sales);
    const profit = this.buildProfitMetrics(context, enrichment, sales);
    const customerIssues = this.buildCustomerIssueMetrics(
      context,
      enrichment,
      conversion.orders.value,
    );
    const refunds = this.buildRefundMetrics(
      context,
      enrichment,
      conversion.orders.value,
    );
    const supplierPerformance = this.buildSupplierPerformance(
      context,
      enrichment,
      supplierId,
    );

    const significantChanges = this.detectSignificantChanges(
      sales,
      conversion,
      profit,
      refunds,
      context,
      config,
      now,
    );
    const classification = this.classifyProductPerformance(
      sales,
      conversion,
      profit,
      refunds,
      context,
      config,
      significantChanges,
    );
    const opportunities = this.identifyOpportunities(
      classification,
      conversion,
      profit,
      refunds,
      supplierPerformance,
      enrichment,
      config,
    );
    const executiveRecommendations = this.buildExecutiveRecommendations(
      classification,
      opportunities,
      significantChanges,
    );

    const evidence = this.compileEvidence(
      context,
      analyticsReportId,
      businessId,
      productId,
      sales,
      conversion,
      profit,
      refunds,
      classification,
      pricingReportId,
      inventoryReportId,
      orderReportIds,
      refundCaseIds,
      input,
      enrichment,
      now,
    );

    const confidenceScore = this.scoreConfidence(
      sales,
      conversion,
      profit,
      enrichment,
      evidence,
      pricingReportId,
      inventoryReportId,
      orderReportIds,
      refundCaseIds,
    );

    return {
      analyticsReportId,
      timestamp: now,
      businessId,
      productId,
      productName,
      supplierId,
      supplierName,
      salesMetrics: sales,
      conversionMetrics: conversion,
      profitMetrics: profit,
      customerIssueMetrics: customerIssues,
      refundMetrics: refunds,
      supplierPerformance,
      productPerformanceClassification: classification,
      significantChanges,
      improvementOpportunities: opportunities,
      executiveRecommendations,
      confidenceScore,
      pricingReportId,
      inventoryReportId,
      orderReportIds,
      refundCaseIds,
      businessMissionId:
        context.businessMissionId?.trim() ||
        enrichment?.businessMissionId?.trim() ||
        null,
      supportingEvidence: evidence,
      metadataVersion: CAW_METADATA_VERSION,
      reportVersion: COMMERCE_ANALYTICS_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || COMMERCE_ANALYTICS_WORKER_IDENTITY.workerId,
      neverModifyProducts: true,
      neverModifyPricing: true,
      neverModifySuppliers: true,
      neverExecuteOptimizations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ314OrLater: true,
      neverModifyOperationalData: true,
      preserveCompleteTraceability: true,
      preserveHistoricalAnalytics: true,
      distinguishMeasuredFromEstimates: true,
      highlightSignificantChanges: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  buildSalesMetrics(
    context: AnalyticsContextInput,
    enrichment: CommerceEnrichmentContext | null | undefined,
    periodLabel: string,
  ): CommerceAnalyticsReport["salesMetrics"] {
    const unitsProvided = finiteNumber(context.unitsSold);
    const revenueProvided = finiteNumber(context.revenue);
    const aovProvided = finiteNumber(context.averageOrderValue);
    const estimatedUnits = enrichment?.estimatedUnitsSold ?? null;
    const estimatedRevenue = enrichment?.estimatedRevenue ?? null;

    let unitsSold: MetricValue;
    if (unitsProvided != null) {
      unitsSold = metric(unitsProvided, "measured", "Units sold provided in analytics context");
    } else if (estimatedUnits != null) {
      unitsSold = metric(
        estimatedUnits,
        "estimated",
        "Units sold estimated from Order Worker enrichment counts",
      );
    } else {
      unitsSold = metric(0, "estimated", "Units sold unavailable — defaulted to 0");
    }

    let revenue: MetricValue;
    if (revenueProvided != null) {
      revenue = metric(revenueProvided, "measured", "Revenue provided in analytics context");
    } else if (estimatedRevenue != null) {
      revenue = metric(
        estimatedRevenue,
        "estimated",
        "Revenue estimated from pricing × order enrichment",
      );
    } else if (
      unitsSold.value > 0 &&
      finiteNumber(context.recommendedSellingPrice ?? enrichment?.recommendedSellingPrice) !=
        null
    ) {
      const price = finiteNumber(
        context.recommendedSellingPrice ?? enrichment?.recommendedSellingPrice,
      )!;
      revenue = metric(
        Number((unitsSold.value * price).toFixed(2)),
        "estimated",
        "Revenue estimated as unitsSold × recommendedSellingPrice",
      );
    } else {
      revenue = metric(0, "estimated", "Revenue unavailable — defaulted to 0");
    }

    let averageOrderValue: MetricValue;
    if (aovProvided != null) {
      averageOrderValue = metric(
        aovProvided,
        "measured",
        "Average order value provided in analytics context",
      );
    } else if (unitsSold.value > 0) {
      averageOrderValue = metric(
        Number((revenue.value / unitsSold.value).toFixed(2)),
        unitsSold.kind === "measured" && revenue.kind === "measured"
          ? "measured"
          : "estimated",
        "Average order value derived as revenue / unitsSold",
      );
    } else {
      averageOrderValue = metric(
        0,
        "estimated",
        "Average order value unavailable — defaulted to 0",
      );
    }

    return { unitsSold, revenue, averageOrderValue, periodLabel };
  }

  buildConversionMetrics(
    context: AnalyticsContextInput,
    enrichment: CommerceEnrichmentContext | null | undefined,
    sales: CommerceAnalyticsReport["salesMetrics"],
  ): CommerceAnalyticsReport["conversionMetrics"] {
    const sessionsProvided = finiteNumber(context.sessions);
    const ordersProvided = finiteNumber(context.orders);
    const estimatedOrders = enrichment?.estimatedOrderCount ?? null;

    const sessions: MetricValue =
      sessionsProvided != null
        ? metric(sessionsProvided, "measured", "Sessions provided in analytics context")
        : metric(0, "estimated", "Sessions unavailable — defaulted to 0");

    let orders: MetricValue;
    if (ordersProvided != null) {
      orders = metric(ordersProvided, "measured", "Orders provided in analytics context");
    } else if (estimatedOrders != null) {
      orders = metric(
        estimatedOrders,
        "estimated",
        "Orders estimated from Order Worker enrichment counts",
      );
    } else if (sales.unitsSold.value > 0) {
      orders = metric(
        sales.unitsSold.value,
        sales.unitsSold.kind,
        "Orders approximated from units sold",
      );
    } else {
      orders = metric(0, "estimated", "Orders unavailable — defaulted to 0");
    }

    const conversionRate: MetricValue =
      sessions.value > 0
        ? metric(
            Number((orders.value / sessions.value).toFixed(4)),
            sessions.kind === "measured" && orders.kind === "measured"
              ? "measured"
              : "estimated",
            "Conversion rate = orders / sessions",
          )
        : metric(
            0,
            "estimated",
            "Conversion rate unavailable — sessions must be greater than 0",
          );

    return { sessions, orders, conversionRate };
  }

  buildProfitMetrics(
    context: AnalyticsContextInput,
    enrichment: CommerceEnrichmentContext | null | undefined,
    sales: CommerceAnalyticsReport["salesMetrics"],
  ): CommerceAnalyticsReport["profitMetrics"] {
    const grossProvided = finiteNumber(context.grossProfit);
    const netProvided = finiteNumber(context.netProfit);
    const cogsProvided = finiteNumber(context.costOfGoods);
    const price = finiteNumber(
      context.recommendedSellingPrice ?? enrichment?.recommendedSellingPrice,
    );
    const landed = finiteNumber(context.landedCost ?? enrichment?.landedCost);

    let grossProfit: MetricValue;
    let netProfit: MetricValue;

    if (grossProvided != null) {
      grossProfit = metric(
        grossProvided,
        "measured",
        "Gross profit provided in analytics context",
      );
    } else if (price != null && landed != null && sales.unitsSold.value > 0) {
      grossProfit = metric(
        Number(((price - landed) * sales.unitsSold.value).toFixed(2)),
        "estimated",
        "Gross profit estimated as (recommendedSellingPrice - landedCost) × unitsSold",
      );
    } else if (cogsProvided != null && sales.revenue.value > 0) {
      grossProfit = metric(
        Number((sales.revenue.value - cogsProvided).toFixed(2)),
        sales.revenue.kind === "measured" ? "measured" : "estimated",
        "Gross profit derived as revenue - costOfGoods",
      );
    } else {
      grossProfit = metric(0, "estimated", "Gross profit unavailable — defaulted to 0");
    }

    if (netProvided != null) {
      netProfit = metric(netProvided, "measured", "Net profit provided in analytics context");
    } else {
      netProfit = metric(
        grossProfit.value,
        grossProfit.kind === "measured" ? "estimated" : "estimated",
        "Net profit approximated from gross profit (no separate net provided)",
      );
    }

    const grossMarginPercent: MetricValue =
      sales.revenue.value > 0
        ? metric(
            Number(((grossProfit.value / sales.revenue.value) * 100).toFixed(2)),
            grossProfit.kind === "measured" && sales.revenue.kind === "measured"
              ? "measured"
              : "estimated",
            "Gross margin percent = (grossProfit / revenue) × 100",
          )
        : metric(0, "estimated", "Gross margin percent unavailable — revenue is 0");

    const netMarginPercent: MetricValue =
      sales.revenue.value > 0
        ? metric(
            Number(((netProfit.value / sales.revenue.value) * 100).toFixed(2)),
            netProfit.kind === "measured" && sales.revenue.kind === "measured"
              ? "measured"
              : "estimated",
            "Net margin percent = (netProfit / revenue) × 100",
          )
        : metric(0, "estimated", "Net margin percent unavailable — revenue is 0");

    return { grossProfit, netProfit, grossMarginPercent, netMarginPercent };
  }

  buildCustomerIssueMetrics(
    context: AnalyticsContextInput,
    enrichment: CommerceEnrichmentContext | null | undefined,
    orderCount: number,
  ): CommerceAnalyticsReport["customerIssueMetrics"] {
    const issueProvided = finiteNumber(context.customerIssueCount);
    const estimatedIssues = enrichment?.estimatedIssueCount ?? null;

    let issueCount: MetricValue;
    if (issueProvided != null) {
      issueCount = metric(
        issueProvided,
        "measured",
        "Customer issue count provided in analytics context",
      );
    } else if (estimatedIssues != null) {
      issueCount = metric(
        estimatedIssues,
        "estimated",
        "Customer issue count estimated from Refund & Dispute Worker cases",
      );
    } else {
      issueCount = metric(0, "estimated", "Customer issue count unavailable — defaulted to 0");
    }

    const issueRate: MetricValue =
      orderCount > 0
        ? metric(
            Number((issueCount.value / orderCount).toFixed(4)),
            issueCount.kind === "measured" ? "measured" : "estimated",
            "Issue rate = issueCount / orders",
          )
        : metric(0, "estimated", "Issue rate unavailable — orders is 0");

    const topIssueTypes =
      enrichment?.topIssueTypes?.length ? [...enrichment.topIssueTypes] : [];

    return { issueCount, issueRate, topIssueTypes };
  }

  buildRefundMetrics(
    context: AnalyticsContextInput,
    enrichment: CommerceEnrichmentContext | null | undefined,
    orderCount: number,
  ): CommerceAnalyticsReport["refundMetrics"] {
    const refundCountProvided = finiteNumber(context.refundCount);
    const refundAmountProvided = finiteNumber(context.refundAmount);
    const estimatedRefunds = enrichment?.estimatedRefundCount ?? null;

    let refundCount: MetricValue;
    if (refundCountProvided != null) {
      refundCount = metric(
        refundCountProvided,
        "measured",
        "Refund count provided in analytics context",
      );
    } else if (estimatedRefunds != null) {
      refundCount = metric(
        estimatedRefunds,
        "estimated",
        "Refund count estimated from Refund & Dispute Worker cases",
      );
    } else {
      refundCount = metric(0, "estimated", "Refund count unavailable — defaulted to 0");
    }

    const refundRate: MetricValue =
      orderCount > 0
        ? metric(
            Number((refundCount.value / orderCount).toFixed(4)),
            refundCount.kind === "measured" ? "measured" : "estimated",
            "Refund rate = refundCount / orders",
          )
        : metric(0, "estimated", "Refund rate unavailable — orders is 0");

    const refundAmount: MetricValue =
      refundAmountProvided != null
        ? metric(
            refundAmountProvided,
            "measured",
            "Refund amount provided in analytics context",
          )
        : metric(0, "estimated", "Refund amount unavailable — defaulted to 0");

    return { refundCount, refundRate, refundAmount };
  }

  buildSupplierPerformance(
    context: AnalyticsContextInput,
    enrichment: CommerceEnrichmentContext | null | undefined,
    supplierId: string | null,
  ): CommerceAnalyticsReport["supplierPerformance"] {
    const onTimeProvided = finiteNumber(context.onTimeFulfilments);
    const totalProvided = finiteNumber(context.totalFulfilments);
    const failuresProvided = finiteNumber(context.fulfilmentFailures);
    const estimatedOnTime = enrichment?.estimatedOnTimeFulfilments ?? null;
    const estimatedTotal = enrichment?.estimatedTotalFulfilments ?? null;
    const estimatedFailures = enrichment?.estimatedFulfilmentFailures ?? null;

    const onTime = onTimeProvided ?? estimatedOnTime ?? 0;
    const total = totalProvided ?? estimatedTotal ?? 0;
    const failures = failuresProvided ?? estimatedFailures ?? 0;
    const onTimeMeasured =
      onTimeProvided != null && totalProvided != null ? "measured" : "estimated";
    const failureMeasured =
      failuresProvided != null && totalProvided != null ? "measured" : "estimated";

    const onTimeRate: MetricValue =
      total > 0
        ? metric(
            Number((onTime / total).toFixed(4)),
            onTimeMeasured,
            "On-time rate = onTimeFulfilments / totalFulfilments",
          )
        : metric(0, "estimated", "On-time rate unavailable — totalFulfilments is 0");

    const fulfilmentFailureRate: MetricValue =
      total > 0
        ? metric(
            Number((failures / total).toFixed(4)),
            failureMeasured,
            "Fulfilment failure rate = fulfilmentFailures / totalFulfilments",
          )
        : metric(
            0,
            "estimated",
            "Fulfilment failure rate unavailable — totalFulfilments is 0",
          );

    const stockStatus =
      enrichment?.stockStatus?.toLowerCase() ??
      this.inferStockStatus(
        finiteNumber(context.currentStock ?? enrichment?.currentStock),
        finiteNumber(context.reorderPoint ?? enrichment?.reorderPoint),
      );

    let stockScore = 0.5;
    let stockNote = "Stock availability estimated as medium (insufficient inventory signal)";
    if (stockStatus === "in_stock" || stockStatus === "available") {
      stockScore = 1;
      stockNote = "Stock availability score = 1.0 (in_stock)";
    } else if (stockStatus === "low" || stockStatus === "low_stock") {
      stockScore = 0.5;
      stockNote = "Stock availability score = 0.5 (low stock)";
    } else if (stockStatus === "out" || stockStatus === "out_of_stock") {
      stockScore = 0;
      stockNote = "Stock availability score = 0.0 (out of stock)";
    }

    const stockAvailabilityScore: MetricValue = metric(
      stockScore,
      enrichment?.stockStatus ||
        finiteNumber(context.currentStock ?? enrichment?.currentStock) != null
        ? "measured"
        : "estimated",
      stockNote,
    );

    const overallScore: MetricValue = metric(
      Number(
        (
          (onTimeRate.value +
            (1 - fulfilmentFailureRate.value) +
            stockAvailabilityScore.value) /
          3
        ).toFixed(4),
      ),
      onTimeRate.kind === "measured" &&
        fulfilmentFailureRate.kind === "measured" &&
        stockAvailabilityScore.kind === "measured"
        ? "measured"
        : "estimated",
      "Overall supplier score = average(onTimeRate, 1-failureRate, stockAvailability)",
    );

    return {
      supplierId,
      onTimeRate,
      fulfilmentFailureRate,
      stockAvailabilityScore,
      overallScore,
    };
  }

  classifyProductPerformance(
    sales: CommerceAnalyticsReport["salesMetrics"],
    conversion: CommerceAnalyticsReport["conversionMetrics"],
    profit: CommerceAnalyticsReport["profitMetrics"],
    refunds: CommerceAnalyticsReport["refundMetrics"],
    context: AnalyticsContextInput,
    config: CommerceAnalyticsWorkerConfiguration,
    significantChanges: SignificantChange[],
  ): ProductPerformanceClassification {
    const hasCore =
      sales.unitsSold.kind === "measured" ||
      sales.revenue.kind === "measured" ||
      conversion.orders.kind === "measured" ||
      conversion.sessions.kind === "measured";

    if (
      !hasCore &&
      sales.unitsSold.value === 0 &&
      sales.revenue.value === 0 &&
      conversion.orders.value === 0
    ) {
      return "insufficient_data";
    }

    const conversionRate = conversion.conversionRate.value;
    const netMargin = profit.netMarginPercent.value;
    const refundRate = refunds.refundRate.value;
    const unitsTrendDown = significantChanges.some(
      (c) => c.metric === "unitsSold" && c.deltaPercent <= -config.significantChangePercent,
    );
    const previousUnits = finiteNumber(context.previousUnitsSold);
    const unitsDeclining =
      unitsTrendDown ||
      (previousUnits != null &&
        previousUnits > 0 &&
        (sales.unitsSold.value - previousUnits) / previousUnits <=
          -config.significantChangePercent);

    if (
      conversionRate >= config.highConversionThreshold &&
      netMargin >= config.highMarginThreshold &&
      refundRate <= config.lowRefundThreshold &&
      !unitsDeclining
    ) {
      return "high_performing";
    }

    if (
      unitsDeclining ||
      refundRate >= config.highRefundThreshold ||
      (conversion.sessions.value > 0 &&
        conversionRate <= config.lowConversionThreshold)
    ) {
      return "declining";
    }

    return "stable";
  }

  detectSignificantChanges(
    sales: CommerceAnalyticsReport["salesMetrics"],
    conversion: CommerceAnalyticsReport["conversionMetrics"],
    profit: CommerceAnalyticsReport["profitMetrics"],
    refunds: CommerceAnalyticsReport["refundMetrics"],
    context: AnalyticsContextInput,
    config: CommerceAnalyticsWorkerConfiguration,
    now: string,
  ): SignificantChange[] {
    const changes: SignificantChange[] = [];
    const threshold = config.significantChangePercent;
    let seq = 0;

    const consider = (
      metricName: string,
      previous: number | null,
      current: number,
      kind: MetricKind,
    ) => {
      if (previous == null || !Number.isFinite(previous)) return;
      if (previous === 0 && current === 0) return;
      const deltaPercent =
        previous === 0
          ? current > 0
            ? 1
            : current < 0
              ? -1
              : 0
          : (current - previous) / Math.abs(previous);
      if (Math.abs(deltaPercent) < threshold) return;
      seq += 1;
      changes.push({
        changeId: `caw-chg-${seq}`,
        metric: metricName,
        previousValue: previous,
        currentValue: current,
        deltaPercent: Number(deltaPercent.toFixed(4)),
        significance:
          Math.abs(deltaPercent) >= threshold * 2
            ? "high"
            : "moderate",
        kind,
        notedAt: now,
      });
    };

    consider(
      "unitsSold",
      finiteNumber(context.previousUnitsSold),
      sales.unitsSold.value,
      sales.unitsSold.kind,
    );
    consider(
      "revenue",
      finiteNumber(context.previousRevenue),
      sales.revenue.value,
      sales.revenue.kind,
    );
    consider(
      "conversionRate",
      finiteNumber(context.previousConversionRate),
      conversion.conversionRate.value,
      conversion.conversionRate.kind,
    );
    consider(
      "netProfit",
      finiteNumber(context.previousNetProfit),
      profit.netProfit.value,
      profit.netProfit.kind,
    );
    consider(
      "refundRate",
      finiteNumber(context.previousRefundRate),
      refunds.refundRate.value,
      refunds.refundRate.kind,
    );

    // Declining units trend contributes to classification when previous provided
    return changes;
  }

  identifyOpportunities(
    classification: ProductPerformanceClassification,
    conversion: CommerceAnalyticsReport["conversionMetrics"],
    profit: CommerceAnalyticsReport["profitMetrics"],
    refunds: CommerceAnalyticsReport["refundMetrics"],
    supplier: CommerceAnalyticsReport["supplierPerformance"],
    enrichment: CommerceEnrichmentContext | null | undefined,
    config: CommerceAnalyticsWorkerConfiguration,
  ): ImprovementOpportunity[] {
    const opportunities: ImprovementOpportunity[] = [];
    let seq = 0;
    const add = (
      severity: ImprovementOpportunity["severity"],
      code: string,
      title: string,
      description: string,
      relatedMetric: string,
    ) => {
      seq += 1;
      opportunities.push({
        opportunityId: `caw-opp-${seq}`,
        severity,
        code,
        title,
        description,
        relatedMetric,
      });
    };

    if (classification === "declining") {
      const severity =
        refunds.refundRate.value >= config.highRefundThreshold ||
        conversion.conversionRate.value <= config.lowConversionThreshold
          ? "critical"
          : "warning";
      add(
        severity,
        "DECLINING_PRODUCT",
        "Declining product performance",
        "Product shows declining performance signals. Pillow should review assortment, conversion funnel, and customer issues — analytics only, no operational changes executed.",
        "productPerformanceClassification",
      );
    }

    if (refunds.refundRate.value >= config.highRefundThreshold) {
      add(
        "warning",
        "HIGH_REFUND_RATE",
        "High refund rate",
        `Refund rate ${refunds.refundRate.value} exceeds high threshold ${config.highRefundThreshold}. Pillow should review refund root causes.`,
        "refundRate",
      );
    }

    if (
      conversion.conversionRate.value > 0 &&
      conversion.conversionRate.value <= config.lowConversionThreshold
    ) {
      add(
        "opportunity",
        "LOW_CONVERSION",
        "Low conversion rate",
        `Conversion rate ${conversion.conversionRate.value} is at or below low threshold ${config.lowConversionThreshold}. Pillow should review listing and funnel quality.`,
        "conversionRate",
      );
    }

    if (classification === "high_performing") {
      add(
        "opportunity",
        "HIGH_PERFORMING_SCALE",
        "High-performing product scale opportunity",
        "Product meets high-performing thresholds. Pillow should review whether to scale marketing or inventory support — advisory only.",
        "productPerformanceClassification",
      );
    }

    const stockOut =
      supplier.stockAvailabilityScore.value === 0 ||
      enrichment?.stockStatus?.toLowerCase() === "out" ||
      enrichment?.stockStatus?.toLowerCase() === "out_of_stock";
    if (supplier.fulfilmentFailureRate.value >= 0.1 || stockOut) {
      add(
        "warning",
        "SUPPLIER_RISK",
        "Supplier fulfilment or stock risk",
        stockOut
          ? "Stock appears out of stock. Pillow should review supplier availability — no supplier modifications executed."
          : `Fulfilment failure rate ${supplier.fulfilmentFailureRate.value} indicates supplier risk. Pillow should review supplier performance.`,
        "supplierPerformance",
      );
    }

    if (
      profit.netMarginPercent.value > 0 &&
      profit.netMarginPercent.value < config.lowMarginThreshold
    ) {
      add(
        "warning",
        "MARGIN_PRESSURE",
        "Net margin pressure",
        `Net margin ${profit.netMarginPercent.value}% is below low margin threshold ${config.lowMarginThreshold}%. Pillow should review pricing and cost structure — no pricing changes executed.`,
        "netMarginPercent",
      );
    }

    return opportunities;
  }

  buildExecutiveRecommendations(
    classification: ProductPerformanceClassification,
    opportunities: ImprovementOpportunity[],
    significantChanges: SignificantChange[],
  ): ExecutiveRecommendation[] {
    const recommendations: ExecutiveRecommendation[] = [];
    let seq = 0;
    const add = (
      priority: ExecutiveRecommendation["priority"],
      recommendation: string,
      rationale: string,
    ) => {
      if (recommendations.length >= 3) return;
      seq += 1;
      recommendations.push({
        recommendationId: `caw-rec-${seq}`,
        priority,
        recommendation,
        rationale,
      });
    };

    if (classification === "declining") {
      add(
        "high",
        "Pillow should review declining product performance and decide whether remediation or assortment changes are warranted.",
        "Classification is declining based on conversion, refund, or sales trend signals. Advisory only — no optimizations executed.",
      );
    } else if (classification === "high_performing") {
      add(
        "medium",
        "Pillow should review whether to scale support for this high-performing product.",
        "Product meets high conversion, margin, and low refund thresholds. Advisory only.",
      );
    } else if (classification === "insufficient_data") {
      add(
        "low",
        "Pillow should ensure commerce workers provide measured analytics context for this product.",
        "Core sales/conversion metrics are insufficient for a confident classification.",
      );
    }

    const criticalOpp = opportunities.find((o) => o.severity === "critical");
    if (criticalOpp) {
      add(
        "high",
        `Pillow should review critical opportunity ${criticalOpp.code}: ${criticalOpp.title}.`,
        criticalOpp.description,
      );
    } else {
      const warningOpp = opportunities.find((o) => o.severity === "warning");
      if (warningOpp) {
        add(
          "medium",
          `Pillow should review warning ${warningOpp.code}: ${warningOpp.title}.`,
          warningOpp.description,
        );
      }
    }

    const topChange = significantChanges[0];
    if (topChange && recommendations.length < 3) {
      add(
        Math.abs(topChange.deltaPercent) >= 0.4 ? "high" : "medium",
        `Pillow should review significant change in ${topChange.metric} (delta ${topChange.deltaPercent}).`,
        `Previous ${topChange.previousValue} → current ${topChange.currentValue}. Highlighted for executive attention only.`,
      );
    }

    if (!recommendations.length) {
      add(
        "low",
        "Pillow should continue monitoring stable commerce analytics for this product.",
        "No critical or high-priority optimization signals detected. Analysis only — never execute improvements.",
      );
    }

    return recommendations;
  }

  compileEvidence(
    context: AnalyticsContextInput,
    analyticsReportId: string,
    businessId: string,
    productId: string,
    sales: CommerceAnalyticsReport["salesMetrics"],
    conversion: CommerceAnalyticsReport["conversionMetrics"],
    profit: CommerceAnalyticsReport["profitMetrics"],
    refunds: CommerceAnalyticsReport["refundMetrics"],
    classification: ProductPerformanceClassification,
    pricingReportId: string | null,
    inventoryReportId: string | null,
    orderReportIds: string[],
    refundCaseIds: string[],
    input: CommerceAnalyticsWorkerInput,
    enrichment: CommerceEnrichmentContext | null | undefined,
    now: string,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    const add = (
      source: string,
      claim: string,
      kind: EvidenceItem["kind"],
      relatedTopic: string,
    ) => {
      seq += 1;
      items.push({
        evidenceId: `ev-${seq}`,
        source,
        claim,
        kind,
        relatedTopic,
        recordedAt: now,
      });
    };

    for (const raw of input.evidenceSources ?? []) {
      const claim = raw.claim?.trim();
      if (!claim) continue;
      add(
        raw.source?.trim() || "provided_source",
        claim,
        raw.kind === "fact" ? "fact" : "assumption",
        raw.relatedTopic?.trim() || "general",
      );
    }

    add(
      "analytics_context",
      `Analytics report ${analyticsReportId} prepared for business ${businessId} / product ${productId}`,
      context.businessId?.trim() || context.productId?.trim() ? "fact" : "assumption",
      "context",
    );
    add(
      "sales_metrics",
      `unitsSold=${sales.unitsSold.value} (${sales.unitsSold.kind}); revenue=${sales.revenue.value} (${sales.revenue.kind})`,
      sales.unitsSold.kind === "measured" || sales.revenue.kind === "measured"
        ? "fact"
        : "assumption",
      "sales",
    );
    add(
      "conversion_metrics",
      `conversionRate=${conversion.conversionRate.value} (${conversion.conversionRate.kind})`,
      conversion.conversionRate.kind === "measured" ? "fact" : "assumption",
      "conversion",
    );
    add(
      "profit_metrics",
      `netProfit=${profit.netProfit.value} (${profit.netProfit.kind}); netMargin=${profit.netMarginPercent.value}%`,
      profit.netProfit.kind === "measured" ? "fact" : "assumption",
      "profit",
    );
    add(
      "refund_metrics",
      `refundRate=${refunds.refundRate.value} (${refunds.refundRate.kind})`,
      refunds.refundRate.kind === "measured" ? "fact" : "assumption",
      "refunds",
    );
    add(
      "classification",
      `Product performance classified as ${classification}`,
      "fact",
      "classification",
    );
    if (pricingReportId) {
      add("pricing_worker", `Traceable to Pricing Report ${pricingReportId}`, "fact", "traceability");
    }
    if (inventoryReportId) {
      add(
        "inventory_worker",
        `Traceable to Inventory Report ${inventoryReportId}`,
        "fact",
        "traceability",
      );
    }
    if (orderReportIds.length) {
      add(
        "order_worker",
        `Traceable to Order Reports: ${orderReportIds.join(", ")}`,
        "fact",
        "traceability",
      );
    }
    if (refundCaseIds.length) {
      add(
        "refund_dispute_worker",
        `Traceable to Refund/Dispute Cases: ${refundCaseIds.join(", ")}`,
        "fact",
        "traceability",
      );
    }
    if (enrichment) {
      add(
        "commerce_enrichment",
        "Product/business context enriched from bound commerce workers",
        "fact",
        "enrichment",
      );
    }
    add(
      "boundary",
      "Analysis-only: does not modify products, pricing, suppliers, operational data, execute optimizations, or override Pillow/Grand King",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    sales: CommerceAnalyticsReport["salesMetrics"],
    conversion: CommerceAnalyticsReport["conversionMetrics"],
    profit: CommerceAnalyticsReport["profitMetrics"],
    enrichment: CommerceEnrichmentContext | null | undefined,
    evidence: EvidenceItem[],
    pricingReportId: string | null,
    inventoryReportId: string | null,
    orderReportIds: string[],
    refundCaseIds: string[],
  ): number {
    const metrics: MetricValue[] = [
      sales.unitsSold,
      sales.revenue,
      sales.averageOrderValue,
      conversion.sessions,
      conversion.orders,
      conversion.conversionRate,
      profit.grossProfit,
      profit.netProfit,
    ];
    const measured = metrics.filter((m) => m.kind === "measured").length;
    const ratio = measured / metrics.length;

    let score = 0.25 + ratio * 0.45;
    if (enrichment) score += 0.1;
    if (pricingReportId) score += 0.05;
    if (inventoryReportId) score += 0.05;
    if (orderReportIds.length) score += 0.05;
    if (refundCaseIds.length) score += 0.05;
    score += Math.min(0.1, evidence.filter((e) => e.kind === "fact").length * 0.015);
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }

  private inferStockStatus(
    currentStock: number | null,
    reorderPoint: number | null,
  ): string | null {
    if (currentStock == null) return null;
    if (currentStock <= 0) return "out_of_stock";
    if (reorderPoint != null && currentStock <= reorderPoint) return "low_stock";
    return "in_stock";
  }
}

let analyticsSequence = 0;

export function resetAnalyticsSequenceForTesting() {
  analyticsSequence = 0;
}

function metric(value: number, kind: MetricKind, note: string): MetricValue {
  return { value, kind, note };
}

function finiteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter((v) => Boolean(v)),
    ),
  );
}

function cloneReport(report: CommerceAnalyticsReport): CommerceAnalyticsReport {
  return {
    ...report,
    salesMetrics: {
      ...report.salesMetrics,
      unitsSold: { ...report.salesMetrics.unitsSold },
      revenue: { ...report.salesMetrics.revenue },
      averageOrderValue: { ...report.salesMetrics.averageOrderValue },
    },
    conversionMetrics: {
      sessions: { ...report.conversionMetrics.sessions },
      orders: { ...report.conversionMetrics.orders },
      conversionRate: { ...report.conversionMetrics.conversionRate },
    },
    profitMetrics: {
      grossProfit: { ...report.profitMetrics.grossProfit },
      netProfit: { ...report.profitMetrics.netProfit },
      grossMarginPercent: { ...report.profitMetrics.grossMarginPercent },
      netMarginPercent: { ...report.profitMetrics.netMarginPercent },
    },
    customerIssueMetrics: {
      ...report.customerIssueMetrics,
      issueCount: { ...report.customerIssueMetrics.issueCount },
      issueRate: { ...report.customerIssueMetrics.issueRate },
      topIssueTypes: [...report.customerIssueMetrics.topIssueTypes],
    },
    refundMetrics: {
      refundCount: { ...report.refundMetrics.refundCount },
      refundRate: { ...report.refundMetrics.refundRate },
      refundAmount: { ...report.refundMetrics.refundAmount },
    },
    supplierPerformance: {
      ...report.supplierPerformance,
      onTimeRate: { ...report.supplierPerformance.onTimeRate },
      fulfilmentFailureRate: { ...report.supplierPerformance.fulfilmentFailureRate },
      stockAvailabilityScore: { ...report.supplierPerformance.stockAvailabilityScore },
      overallScore: { ...report.supplierPerformance.overallScore },
    },
    significantChanges: report.significantChanges.map((c) => ({ ...c })),
    improvementOpportunities: report.improvementOpportunities.map((o) => ({ ...o })),
    executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),
    orderReportIds: [...report.orderReportIds],
    refundCaseIds: [...report.refundCaseIds],
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
