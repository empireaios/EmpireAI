import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { MissionPanel } from "@/components/empire/MissionPanel";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import {
  approveDiscoveryProducts,
  fetchDiscoverySessions,
  runDiscovery,
  startDiscoverySession,
} from "@/api/discovery";
import {
  fetchProductIntelligenceQueue,
  pullSupplierProducts,
  type QueueEntry,
} from "@/api/commerce-intelligence";
import { DEFAULT_DISCOVERY } from "@/config/constants";
import { usePillowPageContext } from "@/context/PillowCompanionContext";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asRecord, asString, asNumber } from "@/lib/empire-data";
import { buildMissionActions } from "@/lib/mission-engine";
import { extractSuccess001Blocker } from "@/lib/success001-blocker";
import { paths } from "@/routes/paths";

export function ProductDiscoveryPage() {
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [busy, setBusy] = useState(false);
  const empire = useEmpireDashboard();

  usePillowPageContext(
    useMemo(
      () => ({
        extensionId: "commerce-intelligence-core",
        workflow: "product-intelligence-queue",
        module: "PILLOW-020",
        businessEntity: {
          program: "PILLOW-020",
          intelligenceOwner: "pillow",
          queueCount: queue.length,
          missionReadyCount: queue.filter((q) => q.status === "mission_ready").length,
        },
      }),
      [queue],
    ),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ sessions: data }, queueRes] = await Promise.all([
        fetchDiscoverySessions(),
        fetchProductIntelligenceQueue().catch(() => ({ queue: [] as QueueEntry[], total: 0 })),
      ]);
      setSessions(data);
      setQueue(queueRes.queue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discovery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const opportunities = useMemo(() => {
    const items = sessions.flatMap((session) => {
      const sessionRecord = asRecord(session);
      const list = sessionRecord?.opportunities;
      if (!Array.isArray(list)) return [];
      return list.map((item) => ({
        ...(asRecord(item) ?? {}),
        sessionId: asString(sessionRecord?.sessionId),
      }));
    }) as Record<string, unknown>[];

    const filtered = items.filter((item) => {
      const name = asString(asRecord(item?.product)?.name ?? item?.productName).toLowerCase();
      return !filter || name.includes(filter.toLowerCase());
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return asString(asRecord(a.product)?.name).localeCompare(asString(asRecord(b.product)?.name));
      }
      return asNumber(b.overallScore) - asNumber(a.overallScore);
    });
  }, [sessions, filter, sortBy]);

  async function handleStartDiscovery() {
    setBusy(true);
    try {
      const { session } = await startDiscoverySession(DEFAULT_DISCOVERY);
      const discovered = await runDiscovery(asString(session.sessionId));
      setSessions((prev) => [discovered.session, ...prev]);
    } finally {
      setBusy(false);
    }
  }

  async function handlePullCjProducts() {
    setBusy(true);
    try {
      const { result } = await pullSupplierProducts();
      setQueue(result.queue);
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove(productId: string, sessionId: string) {
    setBusy(true);
    try {
      await approveDiscoveryProducts(sessionId, [productId]);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const missions = buildMissionActions({
    dashboard: empire.dashboard,
    ofd: empire.ofd,
    brief: empire.brief,
    eyes: empire.eyes,
    executive: empire.executive,
  }).filter((m) => m.category === "intelligence");

  if (loading) return <LoadingState message="Scanning market intelligence…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const topCandidate = opportunities[0];
  const productName = topCandidate
    ? asString(asRecord(topCandidate.product)?.name, asString(topCandidate.productName, "Candidate"))
    : "—";

  return (
    <EmpirePageShell
      eyebrow="Commercial Spine · UX-005"
      title="Product Discovery"
      description="Discover, rank, and route product candidates toward supplier sourcing — with the evidence behind every score."
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${opportunities.length} product candidate(s) in the discovery index.`}
        why="Product Discovery is the commercial spine entry — every candidate must route toward supplier intelligence with evidence."
        next={
          opportunities.length > 0
            ? `Route "${productName}" toward Supplier Intelligence for sourcing validation.`
            : "Run discovery to populate the candidate index from live sources."
        }
        decision={opportunities.length > 0 ? "Select a candidate to advance toward supplier sourcing." : "Start discovery."}
        blocker={extractSuccess001Blocker(empire.success001)}
        blockerTo={null}
        action={
          opportunities.length > 0
            ? { label: "Open Supplier Intelligence", to: paths.dashboard.suppliers }
            : undefined
        }
      />

      <MissionPanel missions={missions} title="Intelligence Missions" compact />

      <ExecutivePanel title="Product Intelligence Queue" eyebrow="Pillow Commerce Intelligence OS · PILLOW-020 · CJ → Amazon US">
        <ExecutiveKpiGrid>
          <ExecutiveKpiCard
            label="Candidates"
            value={queue.length}
            source="CIC"
            health="neutral"
            hint="Normalized supplier products under Pillow ownership"
          />
          <ExecutiveKpiCard
            label="Mission ready"
            value={queue.filter((q) => q.status === "mission_ready").length}
            source="CIC"
            health="ok"
            hint="Approval-ready launch missions generated"
          />
          <ExecutiveKpiCard
            label="Rejected / deferred"
            value={queue.filter((q) => q.status === "rejected" || q.status === "deferred").length}
            source="CIC"
            health="warning"
            hint="Failed margin or lens thresholds"
          />
        </ExecutiveKpiGrid>
        <div className="empireToolbar" style={{ marginTop: "var(--space-4)" }}>
          <button type="button" className="empireBtnPrimary" disabled={busy} onClick={() => void handlePullCjProducts()}>
            {busy ? "Pulling from CJ…" : "Pull CJ products → analyze"}
          </button>
          <Link className="empireBtnSecondary" to={paths.dashboard.launch}>
            Open Launch Missions →
          </Link>
        </div>
        <div className="empireGridCards" style={{ marginTop: "var(--space-4)" }}>
          {queue.length === 0 ? (
            <p className="empireEmpty">No intelligence queue entries. Pull from CJ to populate candidates.</p>
          ) : (
            queue.map((entry) => (
              <article key={entry.candidateId} className="card">
                <h3 className="cardTitle">{entry.title}</h3>
                <p className="cardMeta">
                  Commercial {entry.commercialScore} · Confidence {entry.confidenceScore} · Net margin {entry.netMarginPercent}% ·{" "}
                  <StatusBadge status={entry.status} /> · Route {entry.route}
                </p>
                <p className="cardMeta">{entry.category}</p>
                {entry.rejectionReason && <p className="cardMeta">Rejected: {entry.rejectionReason}</p>}
                {entry.deferReason && <p className="cardMeta">Deferred: {entry.deferReason}</p>}
                {entry.missionId && (
                  <Link className="empireBtnPrimary" to={paths.dashboard.launch}>
                    Review mission →
                  </Link>
                )}
              </article>
            ))
          )}
        </div>
      </ExecutivePanel>

      <ExecutivePanel title="Legacy Product Discovery" eyebrow="UX-005 · discovery sessions">
        <div className="empireToolbar">
        <input
          className="empireInput"
          placeholder="Filter products…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select className="empireSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value as "score" | "name")}>
          <option value="score">Rank by score</option>
          <option value="name">Sort by name</option>
        </select>
        <button type="button" className="empireBtnPrimary" disabled={busy} onClick={() => void handleStartDiscovery()}>
          {busy ? "Discovering…" : "Run discovery"}
        </button>
      </div>

      <div className="empireGridCards">
        {opportunities.length === 0 ? (
          <p className="empireEmpty">No products discovered yet. Run discovery to populate candidates.</p>
        ) : (
          opportunities.map((item) => {
            const product = asRecord(item.product);
            const productId = asString(item.productOpportunityId ?? product?.productOpportunityId);
            const sessionId = asString(item.sessionId ?? (sessions[0] ? asString(asRecord(sessions[0])?.sessionId) : ""));
            const whyReasons = [
              ...asArray(item.why),
              ...asArray(item.reasons),
              ...asArray(product?.why),
            ]
              .map((r) => asString(r))
              .filter((r) => r && r !== "—");
            const rationale = asString(
              item.rationale ?? item.recommendationRationale ?? product?.rationale,
              "",
            );
            return (
              <article key={productId} className="card">
                <h3 className="cardTitle">{asString(product?.name, "Unnamed product")}</h3>
                <p className="cardMeta">
                  Score {asNumber(item.overallScore)} · Margin {asNumber(item.marginPercent)}% ·{" "}
                  <StatusBadge status={asString(item.status, "DISCOVERED")} />
                </p>
                <p className="cardMeta">
                  {asString(product?.category)} · {asString(product?.targetMarket, "US")}
                </p>

                <details className="empireDetails">
                  <summary className="empireDetailsSummary">Why? — evidence</summary>
                  <div className="empireDetailsBody">
                    {rationale && rationale !== "—" && <p className="cardMeta">{rationale}</p>}
                    {whyReasons.length > 0 ? (
                      <ul className="empireList">
                        {whyReasons.map((reason, i) => (
                          <li key={i} className="empireListItem">{reason}</li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="empireList">
                        <li className="empireListItem">Overall score: {asNumber(item.overallScore)}/100</li>
                        <li className="empireListItem">Margin: {asNumber(item.marginPercent)}%</li>
                        <li className="empireListItem">Demand: {asNumber(item.demandScore ?? item.demand)} · Competition: {asNumber(item.competitionScore ?? item.competition)}</li>
                      </ul>
                    )}
                  </div>
                </details>

                <div className="cardActions">
                  <Link
                    className="empireBtnPrimary"
                    to={`${paths.dashboard.suppliers}?candidate=${encodeURIComponent(productId)}`}
                  >
                    Source Supplier →
                  </Link>
                  <button
                    type="button"
                    className="empireBtnSecondary"
                    disabled={busy || asString(item.status) === "APPROVED"}
                    onClick={() => void handleApprove(productId, sessionId)}
                  >
                    {asString(item.status) === "APPROVED" ? "Approved" : "Approve"}
                  </button>
                  <Link className="empireBtnSecondary" to={paths.dashboard.brands}>
                    Brand Workspace
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
