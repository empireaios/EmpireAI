import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { AlertBanner } from "@/components/system/AlertBanner";
import { ApprovalPanel, type ApprovalItem } from "@/components/system/ApprovalPanel";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

type Verdict = "approved" | "rejected";

interface ExpansionRow {
  id: string;
  market: string;
  score: number;
  status: string;
  recommendation: string;
  why: string;
}

export function ExpansionPage() {
  const { globalExpansionScore, loading, error, reload } = useEmpireDashboard();
  const navigate = useNavigate();
  const [proposed, setProposed] = useState<Record<string, true>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  const rows = useMemo<ExpansionRow[]>(() => {
    return asArray(globalExpansionScore?.items).map((raw, i) => {
      const item = asRecord(raw);
      return {
        id: asString(item?.itemId ?? item?.label ?? `target-${i}`),
        market: asString(item?.label, "Expansion target"),
        score: asNumber(item?.score),
        status: asString(item?.status, "PENDING"),
        recommendation: asString(item?.recommendation, "Evaluate expansion target"),
        why: asString(item?.why ?? item?.evidence, "Ranked expansion candidate"),
      };
    });
  }, [globalExpansionScore]);

  if (loading) return <LoadingState message="Scoring expansion targets…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;

  const topTarget = rows[0];
  const readyCount = rows.filter((r) => r.status.toUpperCase() === "READY").length;

  const pendingItems: ApprovalItem[] = rows
    .filter((row) => proposed[row.id] && !verdicts[row.id])
    .map((row) => ({
      id: row.id,
      title: `Expand into ${row.market}`,
      detail: `${row.recommendation} · ${row.why} Expansion executes only after Grand King approval (GC-02).`,
      meta: `Expansion score ${row.score} · REAL-065/089`,
    }));
  const decided = rows.filter((row) => proposed[row.id] && verdicts[row.id]);

  const columns: ExecutiveTableColumn<ExpansionRow>[] = [
    { key: "market", header: "Candidate market", render: (row) => <strong>{row.market}</strong> },
    { key: "score", header: "Expansion score", align: "right", render: (row) => row.score },
    { key: "status", header: "Readiness", render: (row) => <StatusBadge status={row.status} /> },
    { key: "why", header: "Why", render: (row) => row.why },
    {
      key: "action",
      header: "Decision",
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
            Propose expansion →
          </button>
        ),
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Growth · UX-011 · REAL-065 / REAL-089"
      title="Expansion"
      description="Ranked expansion targets by score and readiness — gated, and verified against profit before any move."
      actions={
        <Link to={paths.dashboard.operatingCost} className="empireBtnSecondary">
          Verify Profit First
        </Link>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={
          topTarget
            ? `${rows.length} expansion target(s) ranked · top: ${topTarget.market} (score ${topTarget.score}) · ${readyCount} ready.`
            : "No expansion targets scored yet."
        }
        why="Expansion only pays off after the current market's profit is proven (SUCCESS-001 before scale)."
        next={
          pendingItems.length > 0
            ? "Approve or reject the proposed expansion(s) in the governance queue."
            : "Verify profit, then propose the highest-scoring ready market for approval."
        }
        decision={
          pendingItems.length > 0
            ? `${pendingItems.length} expansion(s) awaiting your verdict (GC-02).`
            : "No expansion decision pending."
        }
        blocker={
          readyCount === 0
            ? "No market is expansion-ready — prove profit and readiness first."
            : "Expansion gated on Grand King approval."
        }
        action={{ label: "Verify profit (P&L)", to: paths.dashboard.operatingCost }}
      />

      <AlertBanner
        severity="info"
        title="Expansion is gated and profit-verified (GC-02)"
        message="No market is entered without Grand King approval. Confirm net profit on the Profit & Operating Cost screen before committing to expansion."
        action={{ label: "Verify Profit & Operating Cost", to: paths.dashboard.operatingCost }}
      />

      <ExecutivePanel
        title="Ranked Expansion Targets"
        eyebrow="REAL-089 — expansion score + candidate market (reuses REAL-065/029)"
      >
        <ExecutiveTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="No expansion targets yet. Targets appear as the empire proves its first markets."
        />
      </ExecutivePanel>

      <ExecutivePanel
        title="Pending Grand King Approval (GC-02)"
        eyebrow="No market entered without a verdict"
        variant={pendingItems.length > 0 ? "accent" : "muted"}
      >
        <ApprovalPanel
          title="Expansions Awaiting Approval"
          items={pendingItems}
          emptyMessage="No expansions proposed. Use “Propose expansion” on a ranked target to stage a governed move."
          onApprove={(id) => setVerdicts((prev) => ({ ...prev, [id]: "approved" }))}
          onReject={(id) => setVerdicts((prev) => ({ ...prev, [id]: "rejected" }))}
          onInvestigate={() => navigate(paths.dashboard.operatingCost)}
        />
        {decided.length > 0 && (
          <ul className="empireList" style={{ marginTop: "var(--space-4)" }}>
            {decided.map((row) => (
              <li
                key={row.id}
                className="empireListItem"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <span>
                  <strong>{row.market}</strong> · score {row.score}
                </span>
                <StatusBadge
                  status={verdicts[row.id] === "approved" ? "APPROVED" : "REJECTED"}
                  label={verdicts[row.id] === "approved" ? "Approved · execution gated" : "Rejected"}
                />
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
