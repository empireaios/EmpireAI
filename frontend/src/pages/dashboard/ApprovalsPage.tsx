import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { ApprovalPanel } from "@/components/system/ApprovalPanel";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { brainDispatch } from "@/api/dispatch";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { buildApprovalQueue } from "@/lib/approval-queue";
import { paths } from "@/routes/paths";
import styles from "./ApprovalsPage.module.css";

type Verdict = "approved" | "rejected" | "deferred";
type SyncState = "syncing" | "recorded" | "local";

interface QueueItem {
  id: string;
  title: string;
  detail?: string;
  meta?: React.ReactNode;
  investigateTo: string;
  source: string;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  approved: "Approved",
  rejected: "Rejected",
  deferred: "Deferred",
};

/** Verdict → decision-registry decision string (owner route payload). */
const VERDICT_DECISION: Record<Verdict, string> = {
  approved: "APPROVED",
  rejected: "REJECTED",
  deferred: "DEFERRED",
};

export function ApprovalsPage() {
  const { executiveCouncil, success001, grandKingRevenuePipeline, kingDecisionHistory, loading, error, reload } =
    useEmpireDashboard();
  const navigate = useNavigate();
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [syncState, setSyncState] = useState<Record<string, SyncState>>({});

  const items = useMemo<QueueItem[]>(() => {
    return buildApprovalQueue(
      { executiveCouncil, success001, grandKingRevenuePipeline },
      {
        debate: paths.dashboard.debate,
        success001: paths.dashboard.success001,
        command: paths.dashboard.command,
      },
    ).map((item) => ({
      ...item,
      meta:
        item.source === "council"
          ? "Source: Executive Council"
          : item.source === "success001"
            ? "Source: SUCCESS-001"
            : "Source: Revenue Pipeline",
    }));
  }, [executiveCouncil, success001, grandKingRevenuePipeline]);

  const historyItems = useMemo(() => asArray(kingDecisionHistory?.items).map(asRecord), [kingDecisionHistory]);

  if (loading) return <LoadingState message="Loading your decision queue…" />;
  if (error) {
    return <ErrorState message={error} onRetry={() => void reload()} />;
  }

  const pending = items.filter((item) => !verdicts[item.id]);
  const decided = items.filter((item) => verdicts[item.id]);

  function recordVerdict(id: string, verdict: Verdict) {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    // Optimistic local verdict — the King's decision is never blocked by transport.
    setVerdicts((prev) => ({ ...prev, [id]: verdict }));
    setSyncState((prev) => ({ ...prev, [id]: "syncing" }));

    // Call the owner route: persist the verdict to the canonical decision registry
    // (REAL-086 King Decision History surfaces it). No new API is invented.
    brainDispatch("decision-registry", "record", GRAND_KING_COMPANY_ID, {
      decisionId: `approval-${id}`,
      title: target.title,
      category: "strategic",
      decision: VERDICT_DECISION[verdict],
      reason: target.detail ?? "Grand King verdict via Approvals Center (UX-014)",
      approver: "Grand King",
      actor: "grand-king",
      metadata: { source: target.source, surface: "UX-014" },
    })
      .then(() => setSyncState((prev) => ({ ...prev, [id]: "recorded" })))
      .catch(() => setSyncState((prev) => ({ ...prev, [id]: "local" })));
  }

  function investigate(id: string) {
    const target = items.find((item) => item.id === id);
    if (target) navigate(target.investigateTo);
  }

  return (
    <EmpirePageShell
      eyebrow="Grand King · EC-011"
      title="Approvals Center"
      description="Every motion waits for your verdict. Nothing executes without the Grand King (DOCTRINE-005)."
      actions={
        <>
          <Link to={paths.dashboard.debate} className="empireBtnSecondary">
            Back to Debate
          </Link>
          <Link to={paths.dashboard.kingHistory} className="empireBtnSecondary">
            King Decision History →
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${items.length} motion(s) reached your desk — ${pending.length} still awaiting a verdict.`}
        why="Executives advise and Soul synthesizes, but only the Grand King authorizes action."
        next={
          pending.length > 0
            ? "Clear the queue: Approve, Reject, or Defer — each verdict is written to the decision registry."
            : "Queue is clear — return to Command Center for the next opportunity."
        }
        decision={
          pending.length > 0
            ? `${pending.length} item(s) require your decision now.`
            : "No decision pending."
        }
        blocker={pending.length > 0 ? `${pending.length} unresolved approval(s)` : "Nothing blocking approvals."}
      />

      <ApprovalPanel
        title="Awaiting Your Decision"
        items={pending}
        emptyMessage="The queue is clear — no motions awaiting your verdict."
        onApprove={(id) => recordVerdict(id, "approved")}
        onReject={(id) => recordVerdict(id, "rejected")}
        onDefer={(id) => recordVerdict(id, "deferred")}
        onInvestigate={investigate}
      />

      {decided.length > 0 && (
        <ExecutivePanel title="Decisions This Session" eyebrow="Recorded to decision registry · REAL-086">
          <ul className={styles.decidedList}>
            {decided.map((item) => {
              const verdict = verdicts[item.id];
              const sync = syncState[item.id];
              return (
                <li key={item.id} className={styles.decidedItem} data-verdict={verdict}>
                  <span className={styles.decidedTitle}>{item.title}</span>
                  <span className={styles.actions}>
                    <span className={styles.ownerNote}>
                      {sync === "recorded"
                        ? "Recorded to history"
                        : sync === "syncing"
                          ? "Recording…"
                          : "Recorded locally · sync pending"}
                    </span>
                    <span className={styles.verdictTag} data-verdict={verdict}>
                      {VERDICT_LABEL[verdict]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </ExecutivePanel>
      )}

      <ExecutivePanel title="Decision History" eyebrow="REAL-086 · King Decision History">
        {historyItems.length === 0 ? (
          <p className={styles.ownerNote}>No prior decisions recorded yet — your verdicts will land here.</p>
        ) : (
          <ul className={styles.decidedList}>
            {historyItems.map((item, index) => (
              <li key={asString(item?.itemId, String(index))} className={styles.decidedItem}>
                <span className={styles.decidedTitle}>
                  {asString(item?.label, "Decision")}
                  {item?.recommendation ? ` — ${asString(item?.recommendation)}` : ""}
                </span>
                <span className={styles.actions}>
                  {item?.score !== undefined && (
                    <span className={styles.ownerNote}>score {asNumber(item?.score, 0)}</span>
                  )}
                  <StatusBadge status={asString(item?.status, "PENDING")} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
