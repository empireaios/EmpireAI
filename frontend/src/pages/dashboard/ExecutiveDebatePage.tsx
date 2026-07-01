import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString, formatCurrencyFromDollars } from "@/lib/empire-data";
import { paths } from "@/routes/paths";
import styles from "./ExecutiveDebatePage.module.css";

export function ExecutiveDebatePage() {
  const { executiveCouncil, executiveVisualDebate, executive, success001, loading, error, reload } =
    useEmpireDashboard();

  if (loading) return <LoadingState message="Convening the Executive Council…" />;
  if (error && !executiveCouncil && !executiveVisualDebate) {
    return <ErrorState message={error ?? "Executive Council unavailable"} onRetry={() => void reload()} />;
  }

  const ec = asRecord(executiveCouncil);
  const council = asRecord(ec?.executiveCouncil);
  const executives = asArray(council?.registeredExecutives).map((e) => asRecord(e));
  const currentDebate = asRecord(ec?.currentDebate);
  const consensus = asString(ec?.consensus, "AWAITING_DEBATE").replace(/_/g, " ");
  const confidence = asNumber(ec?.commercialConfidence);
  const ceoBriefing = asString(ec?.ceoBriefing, asString(asRecord(executive)?.ceoBriefing, "Council standing by."));
  const awaiting = asArray(ec?.recommendationsAwaitingKing).map((r) => asRecord(r));
  const disagreements = asArray(ec?.disagreements).map((d) => asRecord(d));
  const risks = asArray(ec?.risks).map((r) => asRecord(r));

  // REAL-055 — visual debate: chiefs' positions for the current case.
  const debate = asRecord(executiveVisualDebate);
  const chiefCards = asArray(debate?.chiefCards).map((c) => asRecord(c));
  const soul = asRecord(debate?.soulRecommendation);
  const caseTopic = asString(debate?.topic, asString(currentDebate?.topic, "No active case — council on standby."));
  const subjectType = asString(debate?.subjectType, "general");

  const topBlocker =
    asString(asArray(success001?.commercialBlockers)[0]) !== "—"
      ? asString(asArray(success001?.commercialBlockers)[0])
      : "No commercial blocker flagged by the council.";

  const soulRec = asString(soul?.unifiedRecommendation, "Soul has not yet synthesized a unified recommendation.");
  const soulConfidence = asNumber(soul?.confidence, confidence);
  const dissent = asArray(soul?.dissent).map((d) => asString(d)).filter((d) => d !== "—");

  return (
    <EmpirePageShell
      eyebrow="Executive Council · UX-012 · REAL-055"
      title="Executive Debate"
      description="Chiefs take positions on the case. Soul synthesizes. You decide. No motion auto-executes (DOCTRINE-005)."
      actions={
        <>
          <Link to={paths.dashboard.soul} className="empireBtnSecondary">
            To Soul Chamber
          </Link>
          <Link to={paths.dashboard.approvals} className="empireBtnPrimary">
            Go to Approvals
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`Case "${caseTopic}" — ${chiefCards.length} chief(s) took positions; council consensus ${consensus.toLowerCase()} at ${confidence}% confidence.`}
        why={ceoBriefing}
        next={
          awaiting.length > 0
            ? `Send Soul's synthesis on ${awaiting.length} recommendation(s) to Approvals for your verdict.`
            : "Review the chiefs' positions and send Soul's synthesis to Approvals."
        }
        decision={
          awaiting.length > 0
            ? `Approve, reject, or investigate ${awaiting.length} council recommendation(s).`
            : "Send the synthesized recommendation to Approvals when ready."
        }
        blocker={topBlocker}
        action={{ label: "Open Approvals", to: paths.dashboard.approvals }}
      />

      <ExecutivePanel
        title="The Case"
        eyebrow={`REAL-055 · subject: ${subjectType}`}
        actions={<StatusBadge status={asString(ec?.consensus, "AWAITING_DEBATE")} />}
      >
        <div className={styles.consensusRow}>
          <div className={styles.consensusCell}>
            <span className="empireMetricLabel">Topic</span>
            <p className={styles.consensusValue}>{caseTopic}</p>
          </div>
          <div className={styles.consensusCell}>
            <span className="empireMetricLabel">Commercial confidence</span>
            <p className={styles.consensusValue}>{confidence}%</p>
          </div>
          <div className={styles.consensusCell}>
            <span className="empireMetricLabel">Chiefs weighing in</span>
            <p className={styles.consensusValue}>{chiefCards.length || executives.length}</p>
          </div>
        </div>
      </ExecutivePanel>

      <ExecutivePanel title="Chiefs' Positions" eyebrow={`${chiefCards.length} positions on this case`}>
        {chiefCards.length === 0 ? (
          <p className="empireCardBody">
            No chief positions yet for this case. Positions appear when the visual debate is built (REAL-055).
          </p>
        ) : (
          <div className={styles.chiefGrid}>
            {chiefCards.map((chief, index) => (
              <article key={asString(chief?.executiveId, `chief-${index}`)} className={styles.chiefCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                  <h3 className={styles.chiefTitle}>{asString(chief?.title, "Chief")}</h3>
                  <StatusBadge status={asString(chief?.stance, "DEFER")} />
                </div>
                <p className={styles.chiefDomain}>{asString(chief?.recommendation, "Position pending")}</p>
                <span className="empireMetricHint">
                  Confidence {asNumber(chief?.confidence)}% · Impact {formatCurrencyFromDollars(asNumber(chief?.expectedProfitUsd))} · {asNumber(chief?.expectedTimeDays)}d
                </span>
                <span className="empireMetricHint">Risk: {asString(chief?.risk, "—")}</span>
                {asArray(chief?.evidence).length > 0 && (
                  <details>
                    <summary className="empireMetricHint">Evidence</summary>
                    <ul className="empireList">
                      {asArray(chief?.evidence).map((ev, i) => (
                        <li key={i} className="empireListItem">{asString(ev)}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </ExecutivePanel>

      <ExecutivePanel
        title="Soul Synthesis"
        eyebrow="Soul unifies the council → Grand King"
        variant="accent"
        actions={
          <Link to={paths.dashboard.approvals} className="empireBtnPrimary">
            Send to Approvals →
          </Link>
        }
      >
        <p className="empireCardBody">{soulRec}</p>
        <span className="empireMetricHint">
          Soul confidence {soulConfidence}%
          {soul ? ` · expected ${formatCurrencyFromDollars(asNumber(soul?.expectedProfitUsd))} · ${asNumber(soul?.expectedTimeDays)}d` : ""}
        </span>
        {dissent.length > 0 && (
          <ul className="empireList" style={{ marginTop: "0.5rem" }}>
            {dissent.map((d, i) => (
              <li key={i} className="empireListItem">Dissent: {d}</li>
            ))}
          </ul>
        )}
      </ExecutivePanel>

      <div className="empireGridWide">
        <ExecutivePanel title="Recommendations Awaiting Your Verdict" eyebrow="Soul → Grand King" variant="accent">
          {awaiting.length === 0 ? (
            <p className="empireCardBody">No recommendations awaiting your Soul approval.</p>
          ) : (
            <ul className="empireList">
              {awaiting.map((rec, index) => (
                <li key={asString(rec?.decisionId, `rec-${index}`)} className="empireListItem">
                  <strong>{asString(rec?.topic, "Recommendation")}</strong>
                  <span className="empireMetricHint">
                    {" "}
                    — {asString(rec?.majorityRecommendation, asString(rec?.consensus, "Council recommendation"))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to={paths.dashboard.approvals} className="empireBtnSecondary" style={{ marginTop: "0.75rem" }}>
            Decide in Approvals
          </Link>
        </ExecutivePanel>

        <ExecutivePanel title="Conflicts & Risks" eyebrow="Where chiefs disagree">
          {disagreements.length === 0 && risks.length === 0 ? (
            <p className="empireCardBody">No active conflicts or commercial risks flagged.</p>
          ) : (
            <ul className="empireList">
              {disagreements.slice(0, 4).map((conflict, index) => (
                <li key={asString(conflict?.conflictId, `conflict-${index}`)} className="empireListItem">
                  <strong>{asString(conflict?.topic, "Conflict")}</strong>
                  <span className="empireMetricHint"> — severity {asString(conflict?.severity, "—")}</span>
                </li>
              ))}
              {risks.slice(0, 4).map((risk, index) => (
                <li key={`risk-${index}`} className="empireListItem">
                  {asString(risk?.title, asString(risk?.summary, asString(risk)))}
                </li>
              ))}
            </ul>
          )}
        </ExecutivePanel>
      </div>
    </EmpirePageShell>
  );
}
