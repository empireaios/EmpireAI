import { moneyFromMinor } from "./money.js";
import { nextWidgetId } from "./reporting-store.js";
import type {
  BudgetSummary,
  CapitalSummary,
  CashflowSummary,
  ConsolidationContext,
  DashboardWidget,
  EnterpriseKpis,
  ExecutiveDashboard,
  ExpenseSummary,
  ForecastSummary,
  InjectedBudgetReport,
  InjectedCashflowReport,
  InjectedForecastingReport,
  InjectedInvestmentPlanningReport,
  InjectedProfitabilityReport,
  InjectedTaxSupportReport,
  InvestmentSummary,
  ProfitabilitySummary,
  RevenueSummary,
  TaxSupportSummary,
} from "./types.js";

function pickMoney(
  currency: string,
  minor: number | null | undefined,
): ReturnType<typeof moneyFromMinor> | null {
  if (minor == null || !Number.isInteger(minor)) return null;
  return moneyFromMinor(minor, currency);
}

function unavailableRevenue(): RevenueSummary {
  return {
    totalRevenue: null,
    recordKind: "unavailable",
    sourceRefs: [],
    status: "unavailable",
    fabricated: false,
  };
}

function unavailableExpense(): ExpenseSummary {
  return {
    totalExpense: null,
    recordKind: "unavailable",
    sourceRefs: [],
    status: "unavailable",
    fabricated: false,
  };
}

function unavailableCashflow(): CashflowSummary {
  return {
    netCashflow: null,
    closingCashBalance: null,
    openingCashBalance: null,
    recordKind: "unavailable",
    sourceRefs: [],
    status: "unavailable",
    fabricated: false,
  };
}

function unavailableBudget(): BudgetSummary {
  return {
    availableBudget: null,
    allocatedBudget: null,
    recordKind: "unavailable",
    sourceRefs: [],
    status: "unavailable",
    fabricated: false,
  };
}

function unavailableProfitability(): ProfitabilitySummary {
  return {
    grossProfit: null,
    operatingProfit: null,
    netProfit: null,
    recordKind: "unavailable",
    sourceRefs: [],
    status: "unavailable",
    fabricated: false,
  };
}

function unavailableForecast(): ForecastSummary {
  return {
    projectedRevenue: null,
    projectedExpenses: null,
    recordKind: "unavailable",
    sourceRefs: [],
    status: "unavailable",
    fabricated: false,
  };
}

function unavailableInvestment(): InvestmentSummary {
  return {
    availableCapital: null,
    evaluatedOpportunityCount: null,
    recordKind: "unavailable",
    sourceRefs: [],
    status: "unavailable",
    fabricated: false,
  };
}

function unavailableTaxSupport(): TaxSupportSummary {
  return {
    estimatedTaxLiability: null,
    recordKind: "unavailable",
    sourceRefs: [],
    status: "unavailable",
    fabricated: false,
  };
}

function firstMatchingReport<T extends { capitalBusinessId?: string | null; reportingPeriod?: string | null; forecastPeriod?: string | null }>(
  reports: T[],
  currency: string,
): T | null {
  return reports.length ? reports[0]! : null;
}

export function buildRevenueSummary(ctx: ConsolidationContext): RevenueSummary {
  if (ctx.revenueSnapshot?.fabricated === false && ctx.revenueSnapshot.sourceRefs.length > 0) {
    return {
      totalRevenue: pickMoney(ctx.revenueSnapshot.currency, ctx.revenueSnapshot.totalRevenueMinor),
      recordKind: "factual_measured",
      sourceRefs: [...ctx.revenueSnapshot.sourceRefs],
      status: "available",
      fabricated: false,
    };
  }
  return unavailableRevenue();
}

export function buildExpenseSummary(ctx: ConsolidationContext): ExpenseSummary {
  if (ctx.expenseSnapshot?.fabricated === false && ctx.expenseSnapshot.sourceRefs.length > 0) {
    return {
      totalExpense: pickMoney(ctx.expenseSnapshot.currency, ctx.expenseSnapshot.totalExpenseMinor),
      recordKind: "factual_measured",
      sourceRefs: [...ctx.expenseSnapshot.sourceRefs],
      status: "available",
      fabricated: false,
    };
  }
  return unavailableExpense();
}

export function buildCashflowSummary(ctx: ConsolidationContext): CashflowSummary {
  if (ctx.cashflowSnapshot?.fabricated === false && ctx.cashflowSnapshot.sourceRefs.length > 0) {
    return {
      netCashflow: pickMoney(ctx.cashflowSnapshot.currency, ctx.cashflowSnapshot.netCashflowMinor),
      closingCashBalance: pickMoney(ctx.cashflowSnapshot.currency, ctx.cashflowSnapshot.closingCashBalanceMinor),
      openingCashBalance: pickMoney(ctx.cashflowSnapshot.currency, ctx.cashflowSnapshot.openingCashBalanceMinor),
      recordKind: "factual_measured",
      sourceRefs: [...ctx.cashflowSnapshot.sourceRefs],
      status: "available",
      fabricated: false,
    };
  }
  const reports = ctx.injectedCashflowReports ?? [];
  const report = firstMatchingReport<InjectedCashflowReport>(reports, ctx.currency);
  if (report) {
    const refs = [String(report.reportId ?? "cashflow-injected")];
    const net = report.netCashflow;
    const closing = report.closingCashBalance;
    const opening = report.openingCashBalance;
    if (net || closing || opening) {
      return {
        netCashflow: net && net.currency === ctx.currency ? pickMoney(net.currency, net.minorUnits) : null,
        closingCashBalance:
          closing && closing.currency === ctx.currency ? pickMoney(closing.currency, closing.minorUnits) : null,
        openingCashBalance:
          opening && opening.currency === ctx.currency ? pickMoney(opening.currency, opening.minorUnits) : null,
        recordKind: "factual_measured",
        sourceRefs: refs,
        status: "available",
        fabricated: false,
      };
    }
  }
  return unavailableCashflow();
}

export function buildBudgetSummary(ctx: ConsolidationContext): BudgetSummary {
  if (ctx.budgetSnapshot?.fabricated === false && ctx.budgetSnapshot.sourceRefs.length > 0) {
    return {
      availableBudget: pickMoney(ctx.budgetSnapshot.currency, ctx.budgetSnapshot.availableBudgetMinor),
      allocatedBudget: pickMoney(ctx.budgetSnapshot.currency, ctx.budgetSnapshot.allocatedBudgetMinor),
      recordKind: "factual_measured",
      sourceRefs: [...ctx.budgetSnapshot.sourceRefs],
      status: "available",
      fabricated: false,
    };
  }
  const reports = ctx.injectedBudgetReports ?? [];
  const report = firstMatchingReport<InjectedBudgetReport>(reports, ctx.currency);
  if (report) {
    const refs = [String(report.reportId ?? "budget-injected")];
    const available = report.availableBudget;
    const allocated = report.allocatedBudget;
    if (available || allocated) {
      return {
        availableBudget:
          available && available.currency === ctx.currency
            ? pickMoney(available.currency, available.minorUnits)
            : null,
        allocatedBudget:
          allocated && allocated.currency === ctx.currency
            ? pickMoney(allocated.currency, allocated.minorUnits)
            : null,
        recordKind: "factual_measured",
        sourceRefs: refs,
        status: "available",
        fabricated: false,
      };
    }
  }
  return unavailableBudget();
}

export function buildProfitabilitySummary(ctx: ConsolidationContext): ProfitabilitySummary {
  if (ctx.profitabilitySnapshot?.fabricated === false && ctx.profitabilitySnapshot.sourceRefs.length > 0) {
    return {
      grossProfit: pickMoney(ctx.profitabilitySnapshot.currency, ctx.profitabilitySnapshot.grossProfitMinor),
      operatingProfit: pickMoney(ctx.profitabilitySnapshot.currency, ctx.profitabilitySnapshot.operatingProfitMinor),
      netProfit: pickMoney(ctx.profitabilitySnapshot.currency, ctx.profitabilitySnapshot.netProfitMinor),
      recordKind: "factual_measured",
      sourceRefs: [...ctx.profitabilitySnapshot.sourceRefs],
      status: "available",
      fabricated: false,
    };
  }
  const reports = ctx.injectedProfitabilityReports ?? [];
  const report = firstMatchingReport<InjectedProfitabilityReport>(reports, ctx.currency);
  if (report) {
    const refs = [String(report.reportId ?? "profitability-injected")];
    const gross = report.grossProfit;
    const operating = report.operatingProfit;
    const net = report.netProfit;
    if (gross || operating || net) {
      return {
        grossProfit:
          gross && gross.currency === ctx.currency ? pickMoney(gross.currency, gross.minorUnits) : null,
        operatingProfit:
          operating && operating.currency === ctx.currency
            ? pickMoney(operating.currency, operating.minorUnits)
            : null,
        netProfit: net && net.currency === ctx.currency ? pickMoney(net.currency, net.minorUnits) : null,
        recordKind: "factual_measured",
        sourceRefs: refs,
        status: "available",
        fabricated: false,
      };
    }
  }
  return unavailableProfitability();
}

export function buildForecastSummary(ctx: ConsolidationContext): ForecastSummary {
  if (ctx.forecastSnapshot?.fabricated === false && ctx.forecastSnapshot.sourceRefs.length > 0) {
    return {
      projectedRevenue: pickMoney(ctx.forecastSnapshot.currency, ctx.forecastSnapshot.projectedRevenueMinor),
      projectedExpenses: pickMoney(ctx.forecastSnapshot.currency, ctx.forecastSnapshot.projectedExpensesMinor),
      recordKind: "projected_caller_supplied",
      sourceRefs: [...ctx.forecastSnapshot.sourceRefs],
      status: "available",
      fabricated: false,
    };
  }
  const reports = ctx.injectedForecastingReports ?? [];
  const report = firstMatchingReport<InjectedForecastingReport>(reports, ctx.currency);
  if (report) {
    const refs = [String(report.reportId ?? "forecast-injected")];
    const rev = report.projectedRevenue;
    const exp = report.projectedExpenses;
    if (rev || exp) {
      return {
        projectedRevenue:
          rev && rev.currency === ctx.currency ? pickMoney(rev.currency, rev.minorUnits) : null,
        projectedExpenses:
          exp && exp.currency === ctx.currency ? pickMoney(exp.currency, exp.minorUnits) : null,
        recordKind: "projected_caller_supplied",
        sourceRefs: refs,
        status: "available",
        fabricated: false,
      };
    }
  }
  return unavailableForecast();
}

export function buildInvestmentSummary(ctx: ConsolidationContext): InvestmentSummary {
  if (ctx.investmentSnapshot?.fabricated === false && ctx.investmentSnapshot.sourceRefs.length > 0) {
    return {
      availableCapital: pickMoney(ctx.investmentSnapshot.currency, ctx.investmentSnapshot.availableCapitalMinor),
      evaluatedOpportunityCount: ctx.investmentSnapshot.evaluatedOpportunityCount ?? null,
      recordKind: "projected_caller_supplied",
      sourceRefs: [...ctx.investmentSnapshot.sourceRefs],
      status: "available",
      fabricated: false,
    };
  }
  const reports = ctx.injectedInvestmentReports ?? [];
  const report = firstMatchingReport<InjectedInvestmentPlanningReport>(reports, ctx.currency);
  if (report) {
    const refs = [String(report.reportId ?? "investment-injected")];
    const cap = report.availableCapital;
    if (cap || report.evaluatedOpportunityCount != null) {
      return {
        availableCapital:
          cap && cap.currency === ctx.currency ? pickMoney(cap.currency, cap.minorUnits) : null,
        evaluatedOpportunityCount: report.evaluatedOpportunityCount ?? null,
        recordKind: "projected_caller_supplied",
        sourceRefs: refs,
        status: "available",
        fabricated: false,
      };
    }
  }
  return unavailableInvestment();
}

export function buildTaxSupportSummary(ctx: ConsolidationContext): TaxSupportSummary {
  if (ctx.taxSupportSnapshot?.fabricated === false && ctx.taxSupportSnapshot.sourceRefs.length > 0) {
    return {
      estimatedTaxLiability: pickMoney(
        ctx.taxSupportSnapshot.currency,
        ctx.taxSupportSnapshot.estimatedTaxLiabilityMinor,
      ),
      recordKind: "factual_measured",
      sourceRefs: [...ctx.taxSupportSnapshot.sourceRefs],
      status: "available",
      fabricated: false,
    };
  }
  const reports = ctx.injectedTaxSupportReports ?? [];
  const report = firstMatchingReport<InjectedTaxSupportReport>(reports, ctx.currency);
  if (report) {
    const refs = [
      String(report.reportId ?? "tax-support-injected"),
      ...(report.supportingEvidence ?? []),
    ];
    const liability = report.estimatedTaxLiability;
    if (liability && liability.currency === ctx.currency) {
      return {
        estimatedTaxLiability: pickMoney(liability.currency, liability.minorUnits),
        recordKind: "factual_measured",
        sourceRefs: refs,
        status: "available",
        fabricated: false,
      };
    }
  }
  return unavailableTaxSupport();
}

export function buildCapitalSummary(
  ctx: ConsolidationContext,
  cashflow: CashflowSummary,
  investment: InvestmentSummary,
): CapitalSummary {
  const sourceRefs = [...new Set([...cashflow.sourceRefs, ...investment.sourceRefs])];
  const closingCash = cashflow.closingCashBalance;
  const availableCap = investment.availableCapital;
  if (!closingCash && !availableCap) {
    return {
      totalCapitalPosition: null,
      availableCapital: null,
      closingCashBalance: null,
      recordKind: "unavailable",
      sourceRefs: [],
      status: "unavailable",
      fabricated: false,
    };
  }
  const positionMinor =
    closingCash != null
      ? closingCash.minorUnits
      : availableCap != null
        ? availableCap.minorUnits
        : null;
  return {
    totalCapitalPosition: positionMinor != null ? pickMoney(ctx.currency, positionMinor) : null,
    availableCapital: availableCap,
    closingCashBalance: closingCash,
    recordKind:
      closingCash || availableCap
        ? closingCash
          ? "factual_measured"
          : "projected_caller_supplied"
        : "unavailable",
    sourceRefs,
    status: "available",
    fabricated: false,
  };
}

export function computeEnterpriseKpis(params: {
  currency: string;
  revenue: RevenueSummary;
  expense: ExpenseSummary;
  cashflow: CashflowSummary;
  profitability: ProfitabilitySummary;
}): EnterpriseKpis {
  const factualSourceCount = [
    params.revenue,
    params.expense,
    params.cashflow,
    params.profitability,
  ].filter((s) => s.status === "available" && s.recordKind === "factual_measured").length;

  const revenueMinor =
    params.revenue.status === "available" && params.revenue.recordKind === "factual_measured"
      ? params.revenue.totalRevenue?.minorUnits ?? null
      : null;
  const expenseMinor =
    params.expense.status === "available" && params.expense.recordKind === "factual_measured"
      ? params.expense.totalExpense?.minorUnits ?? null
      : null;
  const netCashflowMinor =
    params.cashflow.status === "available" && params.cashflow.recordKind === "factual_measured"
      ? params.cashflow.netCashflow?.minorUnits ?? null
      : null;
  const netProfitMinor =
    params.profitability.status === "available" && params.profitability.recordKind === "factual_measured"
      ? params.profitability.netProfit?.minorUnits ?? null
      : null;

  let grossMarginBps: number | null = null;
  if (revenueMinor != null && revenueMinor > 0 && netProfitMinor != null) {
    grossMarginBps = Math.round((netProfitMinor / revenueMinor) * 10000);
  }

  return {
    totalRevenueMinor: revenueMinor,
    totalExpenseMinor: expenseMinor,
    netCashflowMinor,
    netProfitMinor,
    grossMarginBps,
    currency: params.currency,
    factualSourceCount,
    projectedSourceCount: 0,
    recordKind: "computed_from_factual_summaries",
    fabricated: false,
  };
}

function widgetFromSummary(
  kind: DashboardWidget["kind"],
  title: string,
  valueMinor: number | null,
  currency: string,
  recordKind: RevenueSummary["recordKind"],
  sourceRefs: string[],
): DashboardWidget {
  return {
    widgetId: nextWidgetId(),
    kind,
    title,
    valueMinor,
    currency,
    recordKind,
    sourceRefs: [...sourceRefs],
  };
}

export function buildExecutiveDashboard(params: {
  dashboardId: string;
  timestamp: string;
  currency: string;
  revenue: RevenueSummary;
  expense: ExpenseSummary;
  cashflow: CashflowSummary;
  budget: BudgetSummary;
  profitability: ProfitabilitySummary;
  forecast: ForecastSummary;
  investment: InvestmentSummary;
  taxSupport: TaxSupportSummary;
  capital: CapitalSummary;
  kpis: EnterpriseKpis;
}): ExecutiveDashboard {
  const widgets: DashboardWidget[] = [];

  if (params.revenue.status === "available" && params.revenue.totalRevenue) {
    widgets.push(
      widgetFromSummary(
        "revenue_kpi",
        "Total Revenue",
        params.revenue.totalRevenue.minorUnits,
        params.currency,
        params.revenue.recordKind,
        params.revenue.sourceRefs,
      ),
    );
  }
  if (params.expense.status === "available" && params.expense.totalExpense) {
    widgets.push(
      widgetFromSummary(
        "expense_kpi",
        "Total Expense",
        params.expense.totalExpense.minorUnits,
        params.currency,
        params.expense.recordKind,
        params.expense.sourceRefs,
      ),
    );
  }
  if (params.cashflow.status === "available" && params.cashflow.netCashflow) {
    widgets.push(
      widgetFromSummary(
        "cashflow_kpi",
        "Net Cashflow",
        params.cashflow.netCashflow.minorUnits,
        params.currency,
        params.cashflow.recordKind,
        params.cashflow.sourceRefs,
      ),
    );
  }
  if (params.budget.status === "available" && params.budget.availableBudget) {
    widgets.push(
      widgetFromSummary(
        "budget_kpi",
        "Available Budget",
        params.budget.availableBudget.minorUnits,
        params.currency,
        params.budget.recordKind,
        params.budget.sourceRefs,
      ),
    );
  }
  if (params.profitability.status === "available" && params.profitability.netProfit) {
    widgets.push(
      widgetFromSummary(
        "net_profit_kpi",
        "Net Profit",
        params.profitability.netProfit.minorUnits,
        params.currency,
        params.profitability.recordKind,
        params.profitability.sourceRefs,
      ),
    );
  }
  if (params.forecast.status === "available" && params.forecast.projectedRevenue) {
    widgets.push(
      widgetFromSummary(
        "forecast_kpi",
        "Projected Revenue",
        params.forecast.projectedRevenue.minorUnits,
        params.currency,
        params.forecast.recordKind,
        params.forecast.sourceRefs,
      ),
    );
  }
  if (params.investment.status === "available" && params.investment.availableCapital) {
    widgets.push(
      widgetFromSummary(
        "investment_kpi",
        "Available Capital",
        params.investment.availableCapital.minorUnits,
        params.currency,
        params.investment.recordKind,
        params.investment.sourceRefs,
      ),
    );
  }
  if (params.taxSupport.status === "available" && params.taxSupport.estimatedTaxLiability) {
    widgets.push(
      widgetFromSummary(
        "tax_support_kpi",
        "Estimated Tax Liability",
        params.taxSupport.estimatedTaxLiability.minorUnits,
        params.currency,
        params.taxSupport.recordKind,
        params.taxSupport.sourceRefs,
      ),
    );
  }
  if (params.capital.status === "available" && params.capital.totalCapitalPosition) {
    widgets.push(
      widgetFromSummary(
        "capital_kpi",
        "Capital Position",
        params.capital.totalCapitalPosition.minorUnits,
        params.currency,
        params.capital.recordKind,
        params.capital.sourceRefs,
      ),
    );
  }
  if (params.kpis.grossMarginBps != null) {
    widgets.push(
      widgetFromSummary(
        "margin_kpi",
        "Gross Margin (bps)",
        params.kpis.grossMarginBps,
        params.currency,
        "factual_measured",
        ["enterprise-kpis-computed"],
      ),
    );
  }

  return {
    dashboardId: params.dashboardId,
    timestamp: params.timestamp,
    widgets,
    kpis: params.kpis,
  };
}

export function collectOutstandingIssues(summaries: {
  revenue: RevenueSummary;
  expense: ExpenseSummary;
  cashflow: CashflowSummary;
  budget: BudgetSummary;
  profitability: ProfitabilitySummary;
  forecast: ForecastSummary;
  investment: InvestmentSummary;
  taxSupport: TaxSupportSummary;
}): string[] {
  const issues: string[] = [];
  const entries: Array<[string, { status: string }]> = [
    ["revenue", summaries.revenue],
    ["expense", summaries.expense],
    ["cashflow", summaries.cashflow],
    ["budget", summaries.budget],
    ["profitability", summaries.profitability],
    ["forecast", summaries.forecast],
    ["investment", summaries.investment],
    ["tax_support", summaries.taxSupport],
  ];
  for (const [name, summary] of entries) {
    if (summary.status === "unavailable") {
      issues.push(`${name}:source_unavailable — no verified figures supplied`);
    }
  }
  return issues;
}

export function computeConfidenceScore(params: {
  availableSummaryCount: number;
  totalSummaryCount: number;
  evidenceRefCount: number;
}): number {
  const coverage = params.totalSummaryCount > 0 ? params.availableSummaryCount / params.totalSummaryCount : 0;
  const evidenceBoost = Math.min(params.evidenceRefCount * 5, 30);
  return Math.round(Math.min(100, coverage * 70 + evidenceBoost));
}

export function consolidateSummaries(ctx: ConsolidationContext) {
  const revenue = buildRevenueSummary(ctx);
  const expense = buildExpenseSummary(ctx);
  const cashflow = buildCashflowSummary(ctx);
  const budget = buildBudgetSummary(ctx);
  const profitability = buildProfitabilitySummary(ctx);
  const forecast = buildForecastSummary(ctx);
  const investment = buildInvestmentSummary(ctx);
  const taxSupport = buildTaxSupportSummary(ctx);
  const capital = buildCapitalSummary(ctx, cashflow, investment);
  const kpis = computeEnterpriseKpis({ currency: ctx.currency, revenue, expense, cashflow, profitability });
  const outstandingIssues = collectOutstandingIssues({
    revenue,
    expense,
    cashflow,
    budget,
    profitability,
    forecast,
    investment,
    taxSupport,
  });
  return {
    revenue,
    expense,
    cashflow,
    budget,
    profitability,
    forecast,
    investment,
    taxSupport,
    capital,
    kpis,
    outstandingIssues,
  };
}
