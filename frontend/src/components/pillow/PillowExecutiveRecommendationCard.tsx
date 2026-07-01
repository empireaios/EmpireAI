import { useState } from "react";
import { Crown } from "lucide-react";
import type { PillowChatResult } from "@/api/pillow";
import {
  decideExecutiveRecommendation,
  fetchExecutiveDebate,
  type PillowExecutiveDebate,
} from "@/api/pillow-executive-council";
import styles from "./PillowExecutiveRecommendationCard.module.css";

interface PillowExecutiveRecommendationCardProps {
  result: PillowChatResult;
  workspaceId?: string;
}

export function PillowExecutiveRecommendationCard({
  result,
  workspaceId = "grand-king-workspace",
}: PillowExecutiveRecommendationCardProps) {
  const rec = result.executiveRecommendation;
  const [debateOpen, setDebateOpen] = useState(false);
  const [debate, setDebate] = useState<PillowExecutiveDebate | null>(null);
  const [status, setStatus] = useState(rec?.status ?? "awaiting_grand_king");
  const [loadingDebate, setLoadingDebate] = useState(false);

  if (!rec) return null;
  const recommendation = rec;

  async function handleDecide(outcome: "approved" | "rejected" | "deferred") {
    await decideExecutiveRecommendation(recommendation.recommendationId, outcome, workspaceId);
    setStatus(outcome === "approved" ? "approved" : outcome === "rejected" ? "rejected" : "deferred");
  }

  async function toggleDebate() {
    if (debateOpen) {
      setDebateOpen(false);
      return;
    }
    if (!recommendation.debateId) return;
    setLoadingDebate(true);
    try {
      const data = await fetchExecutiveDebate(recommendation.debateId, workspaceId);
      setDebate(data.debate);
      setDebateOpen(true);
    } finally {
      setLoadingDebate(false);
    }
  }

  return (
    <article className={styles.recommendationCard} aria-label="Executive recommendation">
      <div className={styles.header}>
        <h4>
          <Crown size={14} aria-hidden="true" /> Executive Recommendation
        </h4>
        <span className={styles.badge}>{Math.round(rec.confidence)}% confidence</span>
      </div>

      {rec.currentObjective && (
        <p className={styles.meta}>Current objective: {rec.currentObjective}</p>
      )}

      <p className={styles.body}>{rec.recommendation}</p>
      <p className={styles.meta}>{rec.reason}</p>
      <p className={styles.meta}>Status: {status.replace(/_/g, " ")}</p>

      {status === "awaiting_grand_king" && (
        <div className={styles.actions}>
          <button type="button" data-primary="true" onClick={() => void handleDecide("approved")}>
            Approve
          </button>
          <button type="button" onClick={() => void handleDecide("rejected")}>
            Reject
          </button>
          <button type="button" onClick={() => void handleDecide("deferred")}>
            Defer
          </button>
          {rec.debateId && (
            <button type="button" onClick={() => void toggleDebate()} disabled={loadingDebate}>
              {debateOpen ? "Hide Executive Debate" : "View Executive Debate"}
            </button>
          )}
        </div>
      )}

      {debateOpen && debate && (
        <section className={styles.debatePanel} aria-label="Executive debate (internal)">
          <h5>Executive Debate — internal (dissent preserved)</h5>
          {debate.opinions.map((opinion) => (
            <div key={opinion.opinionId} className={styles.opinion}>
              <strong>
                {opinion.title} ({opinion.stance})
              </strong>
              <p>{opinion.recommendation}</p>
              <p className={styles.meta}>{opinion.reasoning}</p>
            </div>
          ))}
          {debate.dissents.length > 0 && (
            <>
              <h5 className={styles.dissent}>Minority opinions</h5>
              {debate.dissents.map((dissent) => (
                <div key={dissent.dissentId} className={styles.opinion}>
                  <strong>{dissent.title}</strong>
                  <p>{dissent.minorityOpinion}</p>
                </div>
              ))}
            </>
          )}
        </section>
      )}
    </article>
  );
}
