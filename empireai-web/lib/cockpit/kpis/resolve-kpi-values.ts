import type { CockpitKpiDefinition } from "./registry";

const KPI_LABEL_TO_LEDGER: Readonly<Record<string, readonly string[]>> = {
  "GMV MTD": ["Portfolio Revenue", "GMV"],
  "Net Margin": ["Net Margin"],
  "Companies Building": ["Active Companies"],
  "Agents Online": ["Agents Online"],
  GMV: ["Portfolio Revenue", "GMV"],
  Margin: ["Net Margin"],
  Companies: ["Active Companies"],
  Agents: ["Agents Online"],
  "Profit Today": ["Profit Today"],
};

type LedgerMetric = {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
};

export function resolveKpiDisplayValue(
  kpi: CockpitKpiDefinition,
  ledgerMetrics: readonly LedgerMetric[],
): { value: string; trend?: string } {
  const candidates = KPI_LABEL_TO_LEDGER[kpi.label] ?? [kpi.label];
  const match = ledgerMetrics.find((m) => candidates.includes(m.label));
  if (!match) {
    return { value: kpi.placeholderValue, trend: kpi.placeholderTrend };
  }
  const trendSymbol =
    match.trend === "up" ? "▲" : match.trend === "down" ? "▼" : kpi.placeholderTrend;
  return { value: match.value, trend: trendSymbol };
}
