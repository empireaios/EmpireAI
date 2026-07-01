import { AlertTriangle, CheckCircle2, Clock, FileText, Shield } from "lucide-react";
import type { PillowApproval, PillowChatResult } from "@/api/pillow";
import { PillowMarkdown } from "./PillowMarkdown";
import { PillowExecutiveRecommendationCard } from "./PillowExecutiveRecommendationCard";
import styles from "./PillowCards.module.css";

export function PillowStatusBanner({
  health,
  lifecycle,
  streaming,
}: {
  health: string;
  lifecycle: string;
  streaming?: boolean;
}) {
  const tone =
    health === "Error"
      ? styles.danger
      : health === "Busy" || streaming
        ? styles.warning
        : styles.success;

  return (
    <div className={`${styles.banner} ${tone}`}>
      <Shield size={16} aria-hidden="true" />
      <span>
        Pillow {health} · {lifecycle}
        {streaming ? " · streaming response" : ""}
      </span>
    </div>
  );
}

export function PillowMissionCard({ result }: { result: PillowChatResult }) {
  if (!result.command?.plan) return null;
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <FileText size={16} aria-hidden="true" />
        <h4>Mission Plan</h4>
      </div>
      <p className={styles.cardMeta}>
        {result.command.intent} · {result.command.category}
      </p>
      <p className={styles.cardBody}>{result.command.plan.objective}</p>
      {result.command.plan.steps && (
        <ul className={styles.steps}>
          {result.command.plan.steps.slice(0, 4).map((step, index) => (
            <li key={index}>{step.label}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function PillowAuditCard({ result }: { result: PillowChatResult }) {
  const score = result.command?.awareness?.repositoryHealthScore;
  if (score === undefined) return null;
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <CheckCircle2 size={16} aria-hidden="true" />
        <h4>Executive Audit Context</h4>
      </div>
      <p className={styles.cardBody}>
        Repository health score: <strong>{score}</strong>
      </p>
      <p className={styles.cardMeta}>
        Journey: {result.command?.awareness?.journeyPosition ?? "—"}
      </p>
      <p className={styles.cardMeta}>
        Mission: {result.command?.awareness?.currentMission ?? "—"}
      </p>
    </article>
  );
}

export function PillowApprovalCard({
  approval,
  onDecide,
  busy,
}: {
  approval: PillowApproval;
  onDecide: (outcome: "Approved" | "Rejected") => void;
  busy?: boolean;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <Clock size={16} aria-hidden="true" />
        <h4>{approval.proposal.title}</h4>
      </div>
      <p className={styles.cardMeta}>{approval.type} · {approval.status}</p>
      <PillowMarkdown content={approval.proposal.summary} />
      {approval.status === "Pending" && (
        <div className={styles.cardActions}>
          <button type="button" disabled={busy} onClick={() => onDecide("Approved")}>
            Approve
          </button>
          <button type="button" disabled={busy} className={styles.reject} onClick={() => onDecide("Rejected")}>
            Reject
          </button>
        </div>
      )}
    </article>
  );
}

export function PillowMessageBubble({
  role,
  content,
  provider,
  result,
}: {
  role: "user" | "assistant";
  content: string;
  provider?: string;
  result?: PillowChatResult;
}) {
  return (
    <div className={`${styles.message} ${role === "user" ? styles.user : styles.assistant}`}>
      <div className={styles.messageMeta}>
        <span>{role === "user" ? "Grand King" : "Pillow"}</span>
        {provider && <span>{provider}</span>}
      </div>
      <PillowMarkdown content={content} />
      {result && role === "assistant" && (
        <>
          <PillowExecutiveRecommendationCard result={result} />
          <PillowMissionCard result={result} />
          <PillowAuditCard result={result} />
        </>
      )}
      {result?.kind === "error" && (
        <p className={styles.errorNote}>
          <AlertTriangle size={14} aria-hidden="true" /> Response used fallback path
        </p>
      )}
    </div>
  );
}
