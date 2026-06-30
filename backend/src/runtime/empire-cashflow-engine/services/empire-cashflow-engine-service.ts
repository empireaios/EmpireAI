import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import type { EmpireCashflowEngine } from "../models/empire-cashflow-engine.js";

type CashflowItem = EmpireCashflowEngine["items"][number];

function cashflowWhy(netCashUsd: number, label: string): string {
  if (netCashUsd >= 0) {
    return `${label} positive cash flow accelerates SUCCESS-001 — reinvest toward USD 100K net profit`;
  }
  return `${label} drains cash — close burn gap before scaling ads (CONSTITUTION-030 blocks SUCCESS-001)`;
}

function makeItem(
  itemId: string,
  label: string,
  amountUsd: number,
  isInflow: boolean,
  status: CashflowItem["status"],
  recommendation: string,
  evidence: string,
): CashflowItem {
  const netCash = isInflow ? amountUsd : -amountUsd;
  const score = Math.max(0, Math.min(100, isInflow ? 55 + Math.min(Math.round(amountUsd / 200), 40) : 45 - Math.min(Math.round(amountUsd / 300), 30)));
  return {
    itemId,
    label,
    score,
    status,
    recommendation,
    evidence,
    why: cashflowWhy(netCash, label),
  };
}

/** REAL-082 — Empire cashflow engine (forecast cash from REAL-019 economics). */
export function buildEmpireCashflowEngine(
  workspaceId: string,
  companyId: string,
): EmpireCashflowEngine {
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const rb = economics.revenueBreakdown;
  const items: CashflowItem[] = [];

  items.push(makeItem(
    "cash-inflow-revenue",
    "Cash inflow · Marketplace revenue",
    economics.monthlyRecurringRevenueUsd,
    true,
    economics.monthlyRecurringRevenueUsd > 0 ? "READY" : "PENDING",
    economics.liveFeedAttached ? "Scale winners with net-profit guardrails" : "Attach live P&L feed — ECON-LIVE-001",
    `MRR $${economics.monthlyRecurringRevenueUsd} · live feed ${economics.liveFeedAttached ? "attached" : "pending"}`,
  ));

  items.push(makeItem(
    "net-cash-position",
    "Net cash · Monthly position",
    Math.abs(economics.cashFlowUsd),
    economics.cashFlowUsd >= 0,
    economics.cashFlowUsd >= 0 ? "READY" : "BLOCKED",
    economics.cashFlowUsd >= 0
      ? "Maintain positive unit economics while scaling"
      : "Reduce monthly burn before scaling ads",
    `Net cash $${economics.cashFlowUsd} · burn $${economics.burnRateUsd}/mo`,
  ));

  items.push(makeItem(
    "expenses-total",
    "Expenses · Total monthly outflow",
    economics.monthlyRecurringCostUsd,
    false,
    economics.netProfitUsd >= 0 ? "READY" : "BLOCKED",
    "Audit cost breakdown — CONSTITUTION-023 net profit before revenue vanity",
    `MRC $${economics.monthlyRecurringCostUsd} · gross profit $${economics.grossProfitUsd}`,
  ));

  const subscriptionCosts = economics.costBreakdown
    .filter((c) => ["HOSTING", "DEVELOPMENT", "AI", "DATABASE", "REDIS", "SUBSCRIPTIONS"].includes(c.category))
    .reduce((s, c) => s + c.monthlyUsd, 0);
  items.push(makeItem(
    "expenses-subscriptions",
    "Expenses · Subscriptions & infrastructure",
    subscriptionCosts,
    false,
    "READY",
    "Keep infra MRC lean until first-dollar proof — FOUNDATION-001",
    economics.costBreakdown.filter((c) => c.monthlyUsd > 0).map((c) => `${c.label} $${c.monthlyUsd}`).join(" · ") || "Baseline infra costs",
  ));

  items.push(makeItem(
    "expenses-supplier",
    "Expenses · Supplier COGS",
    rb.supplierCostsUsd,
    false,
    rb.supplierCostsUsd > 0 ? "READY" : "PENDING",
    "Complete SUP-LIVE-001 live catalog sync before scaling SKUs",
    `Supplier COGS $${rb.supplierCostsUsd}/mo · CJ fulfillment architecture ready`,
  ));

  items.push(makeItem(
    "expenses-advertising",
    "Expenses · Advertising spend",
    rb.advertisingUsd,
    false,
    economics.netProfitUsd > 0 ? "READY" : "BLOCKED",
    economics.netProfitUsd > 0 ? "Scale ads only on net-positive SKUs" : "Defer ad scale until net profit positive",
    `Ad spend $${rb.advertisingUsd}/mo · Meta Ads connector architecture ready`,
  ));

  items.push(makeItem(
    "expenses-marketplace-fees",
    "Expenses · Marketplace referral fees",
    rb.marketplaceFeesUsd,
    false,
    "READY",
    "Factor ~15% marketplace fees into every SKU margin calculation",
    `Marketplace fees $${rb.marketplaceFeesUsd}/mo (~15% of revenue)`,
  ));

  items.push(makeItem(
    "expenses-payment-gateway",
    "Expenses · Payment gateway fees",
    rb.paymentGatewayFeesUsd,
    false,
    "READY",
    "Include Stripe ~2.9% in unit economics before launch",
    `Payment fees $${rb.paymentGatewayFeesUsd}/mo`,
  ));

  items.push(makeItem(
    "expenses-refunds-chargebacks",
    "Expenses · Refunds & chargebacks reserve",
    rb.refundCostsUsd + rb.chargebackCostsUsd,
    false,
    "READY",
    "Maintain refund reserve — CXO monitors post-purchase intelligence",
    `Refunds $${rb.refundCostsUsd} · chargebacks $${rb.chargebackCostsUsd}`,
  ));

  items.push(makeItem(
    "forecast-quarterly-net",
    "Forecast · Quarterly net cash",
    economics.profitForecastUsd,
    economics.profitForecastUsd >= 0,
    economics.profitForecastUsd >= 0 ? "READY" : "BLOCKED",
    economics.breakEvenMonths != null && economics.breakEvenMonths > 0
      ? `Break-even in ~${economics.breakEvenMonths} months at current trajectory`
      : "On track — advance SUCCESS-001 critical path",
    `3-month profit forecast $${economics.profitForecastUsd} · ROI ${economics.roiPercent}%`,
  ));

  const summary = economics.cashFlowUsd >= 0
    ? `REAL-082 · Net cash $${economics.cashFlowUsd}/mo positive · ${items.length} cashflow lines tracked toward SUCCESS-001`
    : `REAL-082 · Net cash $${economics.cashFlowUsd}/mo negative · burn $${economics.burnRateUsd}/mo blocks SUCCESS-001 scale`;

  return {
    moduleId: "empire-cashflow-engine",
    missionId: "REAL-082",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["empire-economics"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
