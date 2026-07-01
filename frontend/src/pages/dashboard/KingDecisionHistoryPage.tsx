import { useMemo } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

interface DecisionRow {
  itemId: string;
  label: string;
  recommendation: string;
  evidence: string;
  why: string;
  status: string;
  score: number;
}

const PLACEHOLDER_ID = "king-no-decisions";

/** Where a logged decision "re-opens" — its source surface (the revenue pipeline / Command Center). */
function sourceFor(itemId: string): string {
  return `${paths.dashboard.command}?decision=${encodeURIComponent(itemId)}`;
}

export function KingDecisionHistoryPage() {
  const { kingDecisionHistory, loading, error, reload } = useEmpireDashboard();

  const history = asRecord(kingDecisionHistory);

  const rows = useMemo<DecisionRow[]>(
    () =>
      asArray(history?.items)
        .map(asRecord)
        .map((item) => ({
          itemId: asString(item?.itemId, ""),
          label: asString(item?.label, "Decision"),
          recommendation: asString(item?.recommendation, ""),
          evidence: asString(item?.evidence, ""),
          why: asString(item?.why, ""),
          status: asString(item?.status, "PENDING"),
          score: asNumber(item?.score, 0),
        })),
    [history],
  );

  if (loading) return <LoadingState message="Loading the King's decision history…" />;
  if (error && !kingDecisionHistory) {
    return <ErrorState message={error ?? "King Decision History unavailable"} onRetry={() => void reload()} />;
  }

  const logged = rows.filter((row) => row.itemId !== PLACEHOLDER_ID);
  const approvals = logged.filter((row) => row.status === "READY" || row.label.includes("APPROVE")).length;
  const rejections = logged.filter((row) => row.status === "BLOCKED" || row.label.includes("REJECT")).length;
  const summary = asString(history?.summary, "");

  const columns: ExecutiveTableColumn<DecisionRow>[] = [
    { key: "label", header: "Decision", render: (row) => <strong>{row.label}</strong> },
    {
      key: "recommendation",
      header: "Outcome / Recommendation",
      render: (row) => row.recommendation || <span className="empireMetricHint">—</span>,
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "score", header: "Score", align: "right", render: (row) => row.score },
    {
      key: "reopen",
      header: "",
      align: "right",
      render: (row) =>
        row.itemId === PLACEHOLDER_ID ? (
          <span className="empireMetricHint">—</span>
        ) : (
          <Link to={sourceFor(row.itemId)} className="empireBtnSecondary">
            Re-open at source →
          </Link>
        ),
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Grand King · UX-015 · REAL-086"
      title="King Decision History"
      description="Every Grand King verdict is preserved. Decisions never disappear — re-open any one to revisit its source (DOCTRINE-005)."
      actions={
        <Link to={paths.dashboard.approvals} className="empireBtnSecondary">
          Back to Approvals
        </Link>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${logged.length} King decision(s) logged in the audit trail — ${approvals} approved, ${rejections} rejected.`}
        why="The audit trail preserves every verdict for governance, accountability, and Soul learning."
        next="Review any logged decision and re-open it at its source to revisit the full context."
        decision="Read-only history — re-open a decision at its source to take new action."
        blocker={
          logged.length === 0
            ? "No decisions recorded yet — advance products to the King's approval queue."
            : "Nothing blocking — the decision trail is complete."
        }
        action={{ label: "Go to Approvals", to: paths.dashboard.approvals }}
      />

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard
          label="Decisions logged"
          value={logged.length}
          source="REAL"
          health="neutral"
          hint="Total verdicts in the audit trail"
          accent
        />
        <ExecutiveKpiCard
          label="Approved"
          value={approvals}
          source="REAL"
          health={approvals > 0 ? "ok" : "neutral"}
          hint="Cleared by the Grand King"
        />
        <ExecutiveKpiCard
          label="Rejected"
          value={rejections}
          source="REAL"
          health={rejections > 0 ? "warning" : "neutral"}
          hint="Blocked to protect capital"
        />
      </ExecutiveKpiGrid>

      <ExecutivePanel
        title="Logged Decisions"
        eyebrow={summary || "REAL-086 — King decision audit trail"}
      >
        <ExecutiveTable
          columns={columns}
          rows={rows}
          getRowKey={(row, index) => row.itemId || String(index)}
          emptyMessage="No King decisions recorded yet."
        />
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
