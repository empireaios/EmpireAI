import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { MissionPanel } from "@/components/empire/MissionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import {
  approveBusinessOpportunity,
  compareBusinessOpportunities,
  fetchBusinessOpportunities,
  rejectBusinessOpportunity,
} from "@/api/business";
import { brainDispatch } from "@/api/dispatch";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asRecord, asString, asNumber } from "@/lib/empire-data";
import { buildMissionActions } from "@/lib/mission-engine";
import { paths } from "@/routes/paths";
import styles from "./BusinessWorkspacePage.module.css";

export function BusinessWorkspacePage() {
  const [opportunities, setOpportunities] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proposed, setProposed] = useState<Record<string, boolean>>({});
  const empire = useEmpireDashboard();
  const { user } = useAuth();

  // UX-018: the operator persona is brand-scoped — no Grand King governance controls.
  const isOperator = user?.role === "operator";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { opportunities: data } = await fetchBusinessOpportunities();
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load businesses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((entry) => entry !== id);
      if (prev.length >= 2) return [prev[1]!, id];
      return [...prev, id];
    });
  }

  async function handleCompare() {
    if (selected.length !== 2) return;
    const { comparison: result } = await compareBusinessOpportunities(selected[0]!, selected[1]!);
    setComparison(result);
  }

  async function handleApprove(id: string) {
    setBusy(true);
    try {
      await approveBusinessOpportunity(id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(id: string) {
    setBusy(true);
    try {
      await rejectBusinessOpportunity(id, "Rejected from Brand Workspace");
      await load();
    } finally {
      setBusy(false);
    }
  }

  // Operator action: propose (not approve). Reuses the business-opportunity-workspace
  // owner's non-approval "save" action — the proposal reaches the Grand King for review.
  async function handlePropose(id: string) {
    setBusy(true);
    try {
      await brainDispatch("business-opportunity-workspace", "save", GRAND_KING_COMPANY_ID, {
        businessOpportunityId: id,
        actor: user?.email ?? "operator",
        notes: "Proposed by operator from Brand Workspace (UX-018) — awaiting Grand King review",
      });
      setProposed((prev) => ({ ...prev, [id]: true }));
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
  }).filter((m) => m.category === "brand");

  if (loading) return <LoadingState message="Loading brand portfolio…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <EmpirePageShell
      eyebrow={isOperator ? "Operator Workspace · UX-018" : "Workspaces"}
      title="Brand Workspace"
      description={
        isOperator
          ? "Your brands — identity, products, margins, and launch readiness. Propose brands for the Grand King to approve."
          : "Living companies — brand identity, products, margins, marketplaces, and launch readiness."
      }
    >
      {!isOperator && <MissionPanel missions={missions} title="Brand Missions" compact />}

      <div className="empireToolbar">
        <button
          type="button"
          className="empireBtnSecondary"
          disabled={selected.length !== 2}
          onClick={() => void handleCompare()}
        >
          Compare selected ({selected.length}/2)
        </button>
      </div>

      {comparison && (
        <section className="empireCard" style={{ marginBottom: "1rem" }}>
          <h2 className="empireCardTitle">Comparison</h2>
          <p>
            Winner: <strong>{asString(comparison.recommendedWinner ?? comparison.winner)}</strong>
          </p>
          <p className="empireCardBody">{asString(comparison.summary)}</p>
        </section>
      )}

      <div className="empireGridCards">
        {opportunities.map((item) => {
          const id = asString(item.businessOpportunityId);
          const brand = asRecord(item.brand);
          const economics = asRecord(item.economics);
          const isSelected = selected.includes(id);
          return (
            <article key={id} className={isSelected ? "card cardSelected" : "card"}>
              <button
                type="button"
                className={styles.selectArea}
                onClick={() => toggleSelect(id)}
              >
                <h3 className="cardTitle">{asString(brand?.businessName, "Business opportunity")}</h3>
                <p className="cardMeta">
                  {asString(economics?.productName)} · ROI {asNumber(item.expectedRoi).toFixed(1)} ·{" "}
                  <StatusBadge status={asString(item.status, "CANDIDATE")} />
                </p>
                <p className="cardMeta">
                  Domination {asNumber(item.dominationScore)} · Launch confidence {asNumber(item.launchConfidence)}%
                </p>
              </button>
              <div className="cardActions">
                {isOperator ? (
                  <button
                    type="button"
                    className="empireBtnPrimary"
                    disabled={busy || proposed[id]}
                    onClick={() => void handlePropose(id)}
                  >
                    {proposed[id] ? "Proposed ✓" : "Propose to Grand King"}
                  </button>
                ) : (
                  <>
                    <button type="button" className="empireBtnPrimary" disabled={busy} onClick={() => void handleApprove(id)}>
                      Approve
                    </button>
                    <button type="button" className="empireBtnSecondary" disabled={busy} onClick={() => void handleReject(id)}>
                      Reject
                    </button>
                  </>
                )}
                <Link className="empireBtnSecondary" to={paths.dashboard.brandDetail(id)}>
                  Enter HQ
                </Link>
                <Link className="empireBtnSecondary" to={paths.dashboard.businessPreview(id)}>
                  Preview
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </EmpirePageShell>
  );
}
