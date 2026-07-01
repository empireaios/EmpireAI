import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { OperatingCostPanel } from "@/components/empire/OperatingCostPanel";
import { AlertBanner } from "@/components/system/AlertBanner";
import { ApprovalPanel, type ApprovalItem } from "@/components/system/ApprovalPanel";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import {
  categoryTotal,
  loadOperatingCost,
  overallOperatingCost,
  type OperatingCostItem,
} from "@/lib/operating-cost";
import { asArray, asNumber, asRecord, asString, formatCurrencyFromDollars } from "@/lib/empire-data";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { paths } from "@/routes/paths";

type Verdict = "approved" | "rejected";

interface TrendRow {
  period: string;
  profitUsd: number;
  current: boolean;
}

interface RecRow {
  id: string;
  title: string;
  evidence: string;
  impactUsd: number;
}

export function OperatingCostPage() {
  const { grandKingFinancialCommandCenter, loading, error, reload } = useEmpireDashboard();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderContext = searchParams.get("order");
  const [items, setItems] = useState<OperatingCostItem[]>(() => loadOperatingCost());
  const [proposed, setProposed] = useState<Record<string, true>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  const infraTotal = useMemo(() => categoryTotal(items, "infrastructure"), [items]);
  const aiTotal = useMemo(() => categoryTotal(items, "ai"), [items]);
  const overall = useMemo(() => overallOperatingCost(items), [items]);
  const entered = items.filter((item) => item.monthlyCostUsd > 0).length;

  const fin = asRecord(grandKingFinancialCommandCenter);
  const econ = asRecord(fin?.economics);

  const revenue = asNumber(fin?.revenueUsd ?? econ?.monthlyRecurringRevenueUsd);
  const backendCost = asNumber(fin?.costsUsd ?? econ?.monthlyRecurringCostUsd);
  const netProfit = asNumber(fin?.profitUsd ?? econ?.netProfitUsd);
  const netMargin = asNumber(fin?.netMarginPercent ?? econ?.contributionMarginPercent);
  const forecast = asNumber(fin?.forecastUsd ?? econ?.profitForecastUsd);

  const trend = useMemo<TrendRow[]>(() => {
    return asArray(fin?.profitTrend).map((t, i) => {
      const r = asRecord(t);
      const period = asString(r?.period, `Period ${i + 1}`);
      return { period, profitUsd: asNumber(r?.profitUsd), current: period.toUpperCase() === "CURRENT" };
    });
  }, [fin]);

  const recommendations = useMemo<RecRow[]>(() => {
    return asArray(fin?.executiveRecommendations).map((r, i) => {
      const rec = asRecord(r);
      return {
        id: asString(rec?.recommendationId ?? rec?.title ?? `rec-${i}`),
        title: asString(rec?.title, "Spend recommendation"),
        evidence: asString(rec?.evidence, "Financial recommendation"),
        impactUsd: asNumber(rec?.expectedProfitImpactUsd),
      };
    });
  }, [fin]);

  if (loading) return <LoadingState message="Loading profit & operating cost…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;

  // Before/after: live net profit vs net profit after the King's operating-cost overlay.
  const profitBefore = netProfit;
  const profitAfter = netProfit - overall;

  const pendingItems: ApprovalItem[] = recommendations
    .filter((rec) => proposed[rec.id] && !verdicts[rec.id])
    .map((rec) => ({
      id: rec.id,
      title: rec.title,
      detail: `${rec.evidence} · expected profit impact ${formatCurrencyFromDollars(rec.impactUsd)}. Money moves only after Grand King approval (GC-02).`,
      meta: "Gated spend/cost change · REAL-020",
    }));
  const decided = recommendations.filter((rec) => proposed[rec.id] && verdicts[rec.id]);

  const trendColumns: ExecutiveTableColumn<TrendRow>[] = [
    {
      key: "period",
      header: "Period",
      render: (row) => (row.current ? <strong>{row.period}</strong> : row.period),
    },
    {
      key: "profitUsd",
      header: "Net profit",
      align: "right",
      render: (row) => formatCurrencyFromDollars(row.profitUsd),
    },
  ];

  const recColumns: ExecutiveTableColumn<RecRow>[] = [
    { key: "title", header: "Recommendation", render: (row) => <strong>{row.title}</strong> },
    { key: "evidence", header: "Evidence", render: (row) => row.evidence },
    {
      key: "impactUsd",
      header: "Profit impact",
      align: "right",
      render: (row) => formatCurrencyFromDollars(row.impactUsd),
    },
    {
      key: "action",
      header: "Spend change",
      align: "right",
      render: (row) =>
        verdicts[row.id] ? (
          <StatusBadge status={verdicts[row.id] === "approved" ? "APPROVED" : "REJECTED"} />
        ) : proposed[row.id] ? (
          <StatusBadge status="PENDING" label="Awaiting approval" />
        ) : (
          <button
            type="button"
            className="empireBtnSecondary"
            onClick={() => setProposed((prev) => ({ ...prev, [row.id]: true }))}
          >
            Propose change →
          </button>
        ),
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Economics · UX-010 · REAL-019 / REAL-020"
      title="Profit & Operating Cost"
      description="Net profit, margin, and the operating cost behind every SUCCESS-001 decision."
      actions={
        <>
          <Link to={paths.dashboard.reports} className="empireBtnSecondary">
            View Reports
          </Link>
          <Link to={paths.dashboard.expansion} className="empireBtnPrimary">
            Expansion →
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`Net profit ${formatCurrencyFromDollars(netProfit)} on ${formatCurrencyFromDollars(revenue)} revenue · ${netMargin}% net margin.`}
        why="Net profit = revenue − operating cost. SUCCESS-001 ($100K net) is only real when this number is accurate."
        next={
          entered === 0
            ? "Enter actual monthly operating costs below — they feed every net-profit calculation."
            : pendingItems.length > 0
              ? "Approve or reject the proposed spend changes in the governance queue."
              : "Review profit trend and propose cost-aware spend changes for approval."
        }
        decision={
          pendingItems.length > 0
            ? `${pendingItems.length} spend change(s) awaiting your verdict (GC-02).`
            : `Confirm the operating budget (currently ${formatCurrencyFromDollars(overall)}/mo).`
        }
        blocker={
          netProfit < 0
            ? `Net profit is negative (${formatCurrencyFromDollars(netProfit)}) — reduce burn before scaling.`
            : entered === 0
              ? "Operating cost unconfirmed — net-profit figures are revenue-only until set."
              : "Profit tracked."
        }
        action={{ label: "Open SUCCESS-001", to: paths.dashboard.success001 }}
      />

      {orderContext && (
        <AlertBanner
          severity="info"
          title={`Profit context for order ${orderContext.slice(0, 8)}`}
          message="Showing empire-level P&L (REAL-020). Per-order margin rolls up into the figures below."
          action={{ label: "Back to Operations", to: paths.dashboard.operations }}
        />
      )}

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard label="Net Profit" value={formatCurrencyFromDollars(netProfit)} source="REAL" health={netProfit >= 0 ? "ok" : "critical"} hint="Revenue − all costs (REAL-020)" accent />
        <ExecutiveKpiCard label="Net Margin" value={`${netMargin}%`} source="REAL" health={netMargin >= 0 ? "ok" : "critical"} hint="Net profit / revenue" />
        <ExecutiveKpiCard label="Revenue" value={formatCurrencyFromDollars(revenue)} source="REAL" health="neutral" hint="Monthly recurring revenue" />
        <ExecutiveKpiCard label="Tracked Cost" value={formatCurrencyFromDollars(backendCost)} source="REAL" health="warning" hint="Monthly recurring cost (REAL-019)" />
      </ExecutiveKpiGrid>

      <ExecutivePanel title="Net Profit — Before / After" eyebrow="REAL-020 trend + your operating-cost overlay">
        <ExecutiveKpiGrid>
          <ExecutiveKpiCard
            label="Net profit (live)"
            value={formatCurrencyFromDollars(profitBefore)}
            health={profitBefore >= 0 ? "ok" : "critical"}
            hint="Before applying your operating-cost overlay"
          />
          <ExecutiveKpiCard
            label="After operating-cost overlay"
            value={formatCurrencyFromDollars(profitAfter)}
            health={profitAfter >= 0 ? "ok" : "critical"}
            hint={`Live net profit − ${formatCurrencyFromDollars(overall)}/mo entered below`}
            accent
          />
          <ExecutiveKpiCard
            label="Profit forecast (+1)"
            value={formatCurrencyFromDollars(forecast)}
            health="neutral"
            hint="Next-period projection"
          />
        </ExecutiveKpiGrid>
        <ExecutiveTable
          columns={trendColumns}
          rows={trend}
          getRowKey={(row, index) => `${row.period}-${index}`}
          caption="Profit trend — past periods (before) through current and forecast (after)"
          emptyMessage="No profit trend yet — figures appear once revenue and costs are recorded."
        />
      </ExecutivePanel>

      <AlertBanner
        severity="info"
        title="Governed spend — no ungated money move (GC-02)"
        message="Spend and cost changes are recommendations. Proposing one stages it for Grand King approval; money moves only after a verdict is recorded."
        action={{ label: "Open Approvals", to: paths.dashboard.approvals }}
      />

      <ExecutivePanel
        title="Cost-Aware Recommendations"
        eyebrow="REAL-020 — propose a spend change (gated)"
      >
        <ExecutiveTable
          columns={recColumns}
          rows={recommendations}
          getRowKey={(row) => row.id}
          emptyMessage="No spend recommendations available."
        />
      </ExecutivePanel>

      <ExecutivePanel
        title="Pending Grand King Approval (GC-02)"
        eyebrow="No ungated money move — every spend change waits for a verdict"
        variant={pendingItems.length > 0 ? "accent" : "muted"}
      >
        <ApprovalPanel
          title="Spend Changes Awaiting Approval"
          items={pendingItems}
          emptyMessage="No spend changes proposed. Use “Propose change” on a recommendation to stage a governed change."
          onApprove={(id) => setVerdicts((prev) => ({ ...prev, [id]: "approved" }))}
          onReject={(id) => setVerdicts((prev) => ({ ...prev, [id]: "rejected" }))}
          onInvestigate={() => navigate(paths.dashboard.approvals)}
        />
        {decided.length > 0 && (
          <ul className="empireList" style={{ marginTop: "var(--space-4)" }}>
            {decided.map((rec) => (
              <li
                key={rec.id}
                className="empireListItem"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <span>
                  <strong>{rec.title}</strong> · impact {formatCurrencyFromDollars(rec.impactUsd)}
                </span>
                <StatusBadge
                  status={verdicts[rec.id] === "approved" ? "APPROVED" : "REJECTED"}
                  label={verdicts[rec.id] === "approved" ? "Approved · execution gated" : "Rejected"}
                />
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard
          label="Infrastructure Total"
          value={formatCurrencyFromDollars(infraTotal)}
          hint="Hosting, data, delivery"
          health={infraTotal > 0 ? "ok" : "neutral"}
        />
        <ExecutiveKpiCard
          label="AI Total"
          value={formatCurrencyFromDollars(aiTotal)}
          hint="Models, embeddings, media"
          health={aiTotal > 0 ? "ok" : "neutral"}
        />
        <ExecutiveKpiCard
          label="Overall Monthly Cost"
          value={formatCurrencyFromDollars(overall)}
          hint="Total burn / month"
          health={overall > 0 ? "warning" : "neutral"}
          accent
        />
      </ExecutiveKpiGrid>

      <OperatingCostPanel items={items} onChange={setItems} />
    </EmpirePageShell>
  );
}
