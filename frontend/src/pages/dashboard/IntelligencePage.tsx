import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchCommercialExplorerDashboard,
  type CommercialExplorerItem,
  type ExplorationDimension,
} from "@/api/commercial-explorer";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import {
  dimensionLabel,
  entityOwnerPath,
  ownerScreenLabel,
} from "@/lib/commercial-explorer-links";
import { formatCurrencyFromDollars } from "@/lib/empire-data";
import { paths } from "@/routes/paths";
import styles from "./CommercialExplorerPage.module.css";

type DimensionFilter = ExplorationDimension | "all";

interface EntityRow extends CommercialExplorerItem {
  ownerPath: string;
  ownerLabel: string;
}

/** UX-023 Commercial Explorer — REAL-066 entity index with owner-screen deep links. */
export function CommercialExplorerPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CommercialExplorerItem[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [computedAt, setComputedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dimension, setDimension] = useState<DimensionFilter>("all");

  const isOperator = user?.role === "operator";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { dashboard } = await fetchCommercialExplorerDashboard(GRAND_KING_COMPANY_ID);
      setItems(dashboard.items);
      setRecommendations(dashboard.topRecommendations);
      setComputedAt(dashboard.computedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load commercial explorer");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOperator) void load();
  }, [isOperator, load]);

  const rows = useMemo<EntityRow[]>(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => dimension === "all" || item.dimension === dimension)
      .filter((item) => {
        if (!normalized) return true;
        return (
          item.name.toLowerCase().includes(normalized) ||
          item.summary.toLowerCase().includes(normalized) ||
          item.evidence.toLowerCase().includes(normalized) ||
          item.recommendation.toLowerCase().includes(normalized)
        );
      })
      .map((item) => ({
        ...item,
        ownerPath: entityOwnerPath(item.dimension, item.itemId),
        ownerLabel: ownerScreenLabel(item.dimension),
      }));
  }, [items, query, dimension]);

  const dimensions = useMemo(() => {
    const set = new Set(items.map((i) => i.dimension));
    return Array.from(set) as ExplorationDimension[];
  }, [items]);

  const columns: ExecutiveTableColumn<EntityRow>[] = [
    {
      key: "dimension",
      header: "Type",
      render: (row) => <StatusBadge status={row.dimension.toUpperCase()} label={dimensionLabel(row.dimension)} />,
    },
    { key: "name", header: "Entity", render: (row) => <strong>{row.name}</strong> },
    { key: "readiness", header: "Readiness", align: "right", render: (row) => `${row.readinessScore}` },
    {
      key: "profit",
      header: "Profit",
      align: "right",
      render: (row) => formatCurrencyFromDollars(row.profitUsd),
    },
    { key: "summary", header: "Summary", render: (row) => row.summary },
    {
      key: "owner",
      header: "Owner screen",
      render: (row) => (
        <Link to={row.ownerPath} className={styles.ownerLink}>
          {row.ownerLabel} →
        </Link>
      ),
    },
  ];

  if (isOperator) {
    return (
      <EmpirePageShell
        eyebrow="Workspaces · UX-023"
        title="Commercial Explorer"
        description="Commercial Explorer is restricted to founder role."
      >
        <ErrorState
          message="Access denied — Commercial Explorer is founder-gated. Operators use Brand Workspace for brand-scoped work."
          onRetry={() => window.history.back()}
        />
      </EmpirePageShell>
    );
  }

  if (loading) return <LoadingState message="Loading REAL-066 entity index…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <EmpirePageShell
      eyebrow="Workspaces · UX-023 · REAL-066"
      title="Commercial Explorer"
      description="Browse the unified entity index — countries, marketplaces, suppliers, categories, and products. Every entity deep-links to its owner screen in one action."
      actions={
        <Link to={paths.dashboard.command} className="empireBtnSecondary">
          Empire Command Center
        </Link>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${items.length} entities indexed · ${rows.length} matching current filter · index computed ${computedAt ? new Date(computedAt).toLocaleString() : "—"}.`}
        why="The empire must be navigable as a graph — REAL-066 unifies commercial dimensions so the Grand King can jump to the owning screen without hunting."
        next="Search or filter by dimension, then open any entity's owner screen."
        decision="No approval required — exploration only."
        blocker={items.length === 0 ? "Entity index empty — check commercial-explorer module." : "Index live."}
      />

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard label="Entities indexed" value={String(items.length)} health="ok" />
        <ExecutiveKpiCard label="Dimensions" value={String(dimensions.length)} hint={dimensions.join(", ")} health="neutral" />
        <ExecutiveKpiCard label="Matching filter" value={String(rows.length)} health="neutral" />
        <ExecutiveKpiCard label="Mission" value="REAL-066" hint="commercial-explorer" health="ok" />
      </ExecutiveKpiGrid>

      <ExecutivePanel title="Entity Index" eyebrow="REAL-066 · GC-04 search shell">
        <div className={styles.searchRow}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search entities — countries, marketplaces, suppliers, categories, products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search commercial entities"
          />
        </div>

        <div className={styles.dimensionTabs} role="tablist" aria-label="Filter by dimension">
          <button
            type="button"
            role="tab"
            aria-selected={dimension === "all"}
            className={dimension === "all" ? styles.tabActive : styles.tab}
            onClick={() => setDimension("all")}
          >
            All
          </button>
          {dimensions.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={dimension === d}
              className={dimension === d ? styles.tabActive : styles.tab}
              onClick={() => setDimension(d)}
            >
              {dimensionLabel(d)}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "var(--space-4)" }}>
          {rows.length === 0 ? (
            <p className="empireCardBody">No entities match your search — try a different query or dimension.</p>
          ) : (
            <ExecutiveTable columns={columns} rows={rows} getRowKey={(row) => row.itemId} />
          )}
        </div>
      </ExecutivePanel>

      {recommendations.length > 0 && (
        <ExecutivePanel title="Top Recommendations" eyebrow="commercial-explorer">
          <ul className={styles.recommendations}>
            {recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </ExecutivePanel>
      )}
    </EmpirePageShell>
  );
}

/** @deprecated Contract reuse asset — UX-023 implemented as CommercialExplorerPage */
export function IntelligencePage() {
  return <CommercialExplorerPage />;
}
