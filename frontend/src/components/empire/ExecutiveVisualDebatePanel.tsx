import { StatusBadge } from "@/components/ui/StatusBadge";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import styles from "./ExecutiveVisualDebatePanel.module.css";

function stanceClass(stance: string): string {
  switch (stance) {
    case "PROCEED":
      return styles.stanceProceed;
    case "PROCEED_WITH_CAUTION":
      return styles.stanceCaution;
    case "REJECT":
      return styles.stanceReject;
    default:
      return styles.stanceDefer;
  }
}

type Props = {
  debate: Record<string, unknown> | null;
  architecturePercent?: number;
};

export function ExecutiveVisualDebatePanel({ debate, architecturePercent }: Props) {
  if (!debate) return null;

  const chiefCards = asArray(debate.chiefCards).map((c) => asRecord(c));
  const soul = asRecord(debate.soulRecommendation);
  const king = asRecord(debate.grandKingDecision);

  return (
    <section className="empireCard" style={{ marginBottom: "1rem" }}>
      <p className="empireEyebrow">Executive Visual Debate (REAL-007)</p>
      <p className="empireMetricHint">
        {asString(debate.topic, "Commerce execution debate")} · Architecture {architecturePercent ?? 72}%
      </p>

      <div className={styles.chiefGrid}>
        {chiefCards.map((chief) => (
          <article key={asString(chief?.executiveId)} className={styles.chiefCard}>
            <h3 className={styles.chiefTitle}>{asString(chief?.title, "Chief")}</h3>
            <p className={styles.chiefRec}>{asString(chief?.recommendation)}</p>
            <div className={styles.chiefMeta}>
              <span className={stanceClass(asString(chief?.stance, "DEFER"))}>
                {asString(chief?.stance, "DEFER").replace(/_/g, " ")}
              </span>
              <span>{asNumber(chief?.confidence)}% conf.</span>
              <span>${asNumber(chief?.expectedProfitUsd).toLocaleString()}</span>
              <span>{asNumber(chief?.expectedTimeDays)}d</span>
            </div>
            <p className="empireMetricHint" style={{ margin: 0, fontSize: "0.7rem" }}>
              Risk: {asString(chief?.risk, "—")}
            </p>
          </article>
        ))}
      </div>

      {soul && (
        <div className={styles.soulPanel}>
          <p className="empireEyebrow">Soul — Unified Recommendation (DOCTRINE-005)</p>
          <p className={styles.soulSummary}>{asString(soul.unifiedRecommendation)}</p>
          <p className="empireMetricHint" style={{ margin: 0 }}>
            Confidence {asNumber(soul.confidence)}% · Expected ${asNumber(soul.expectedProfitUsd).toLocaleString()} ·{" "}
            {asNumber(soul.expectedTimeDays)} days · Dissent: {asArray(soul.dissent).length}
          </p>
        </div>
      )}

      {king && (
        <p className="empireMetricHint" style={{ marginTop: "0.75rem" }}>
          Grand King decision: <StatusBadge status={asString(king.decision, "PENDING")} />
          {king.rationale ? ` — ${asString(king.rationale)}` : ""}
        </p>
      )}
    </section>
  );
}
