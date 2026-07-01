import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

interface MarketRow {
  id: string;
  country: string;
  marketplace: string;
  priceAdvantage: string;
  shippingAdvantage: string;
  demand: string;
  status: string;
  recommended: boolean;
}

function cell(value: unknown, suffix = ""): string {
  if (typeof value === "number" && !Number.isNaN(value)) return `${value}${suffix}`;
  if (typeof value === "string" && value.length > 0) return value;
  return "—";
}

export function MarketplaceIntelligencePage() {
  const { globalMarketplaceOperations, loading, error, reload } = useEmpireDashboard();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const markets = useMemo<MarketRow[]>(() => {
    const raw = [
      ...asArray(globalMarketplaceOperations?.markets),
      ...asArray(globalMarketplaceOperations?.countries),
      ...asArray(globalMarketplaceOperations?.marketplaces),
      ...asArray(globalMarketplaceOperations?.countryComparison),
      ...asArray(globalMarketplaceOperations?.marketComparison),
      ...asArray(globalMarketplaceOperations?.opportunities),
    ].map((m) => asRecord(m));
    return raw.map((m, i) => ({
      id: asString(m?.marketId ?? m?.id ?? m?.countryCode ?? m?.country ?? `market-${i}`),
      country: asString(m?.country ?? m?.countryName ?? m?.region ?? m?.market, "Market"),
      marketplace: asString(m?.marketplace ?? m?.platform ?? m?.channel, "—"),
      priceAdvantage: cell(m?.priceAdvantage ?? m?.priceEdge ?? m?.priceIndex ?? m?.avgPrice),
      shippingAdvantage: cell(
        m?.shippingAdvantage ?? m?.shippingDays ?? m?.deliveryDays ?? m?.leadTimeDays,
      ),
      demand: cell(m?.demandScore ?? m?.demand ?? m?.score ?? m?.opportunityScore),
      status: asString(m?.status, "EVALUATED"),
      recommended: Boolean(m?.recommended ?? m?.isRecommended ?? m?.top ?? m?.bestMarket),
    }));
  }, [globalMarketplaceOperations]);

  const defaultSelectedId = useMemo(() => {
    const recommended = markets.find((m) => m.recommended);
    const active = markets.find((m) => ["ACTIVE", "SELECTED", "PRIMARY"].includes(m.status.toUpperCase()));
    return recommended?.id ?? active?.id ?? markets[0]?.id ?? null;
  }, [markets]);

  if (loading) return <LoadingState message="Comparing global markets…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;

  const effectiveSelectedId = selectedId ?? defaultSelectedId;
  const selected = markets.find((m) => m.id === effectiveSelectedId) ?? null;

  const columns: ExecutiveTableColumn<MarketRow>[] = [
    {
      key: "country",
      header: "Market",
      render: (row) => (
        <span>
          <strong>{row.country}</strong>
          {row.marketplace !== "—" ? ` · ${row.marketplace}` : ""}
        </span>
      ),
    },
    { key: "priceAdvantage", header: "Price advantage", align: "right", render: (row) => row.priceAdvantage },
    { key: "shippingAdvantage", header: "Shipping advantage", align: "right", render: (row) => row.shippingAdvantage },
    { key: "demand", header: "Demand", align: "right", render: (row) => row.demand },
    {
      key: "action",
      header: "Decision",
      align: "right",
      render: (row) =>
        row.id === effectiveSelectedId ? (
          <StatusBadge status="ACTIVE" label="Selected market" />
        ) : (
          <button type="button" className="empireBtnSecondary" onClick={() => setSelectedId(row.id)}>
            Select market
          </button>
        ),
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Commercial Spine · UX-007 · REAL-072/073/074/075/076"
      title="Marketplace Intelligence"
      description="Compare countries and marketplaces, then choose where the Empire competes."
      actions={
        <>
          <Link to={paths.dashboard.suppliers} className="empireBtnSecondary">
            Back to Supplier Intelligence
          </Link>
          <Link to={paths.dashboard.advertising} className="empireBtnPrimary">
            Advertising →
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${markets.length} market(s) compared on price, shipping, and demand.`}
        why="Market choice sets margin headroom, delivery speed, and competitive intensity (CBD-005/011)."
        next={
          selected
            ? `Confirm ${selected.country} as the target market, or select a stronger option.`
            : "Run global market comparison to populate target markets."
        }
        decision={
          selected
            ? `Commit to ${selected.country}${selected.marketplace !== "—" ? ` · ${selected.marketplace}` : ""}, or switch markets.`
            : "Select a target market to advance the commercial spine."
        }
        blocker={markets.length === 0 ? "No market comparison data available." : "No market risk blocking."}
      />

      <ExecutivePanel
        title="Country & Marketplace Comparison"
        eyebrow="REAL-073 / REAL-074 — price & shipping advantage by market"
      >
        <ExecutiveTable
          columns={columns}
          rows={markets}
          getRowKey={(row) => row.id}
          emptyMessage="No market comparison yet. Marketplace Intelligence evaluates countries as candidates advance."
        />
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
