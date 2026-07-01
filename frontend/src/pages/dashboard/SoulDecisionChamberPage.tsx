import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { AlertBanner } from "@/components/system/AlertBanner";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString, formatCurrencyFromDollars } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

function strengthHealth(confidence: number): "ok" | "warning" | "critical" {
  if (confidence >= 70) return "ok";
  if (confidence >= 45) return "warning";
  return "critical";
}

function strengthLabel(confidence: number): string {
  if (confidence >= 70) return "Strong";
  if (confidence >= 45) return "Moderate";
  return "Weak";
}

export function SoulDecisionChamberPage() {
  const { soulDecisionChamber, executiveVisualDebate, loading, error, reload } = useEmpireDashboard();

  if (loading) return <LoadingState message="Entering the Soul Decision Chamber…" />;
  if (error && !soulDecisionChamber && !executiveVisualDebate) {
    return <ErrorState message={error ?? "Soul Decision Chamber unavailable"} onRetry={() => void reload()} />;
  }

  const chamber = asRecord(soulDecisionChamber);
  const fallbackDebate = asRecord(executiveVisualDebate);
  const soul = asRecord(chamber?.soulRecommendation) ?? asRecord(fallbackDebate?.soulRecommendation);

  const topic = asString(chamber?.topic, asString(fallbackDebate?.topic, "Soul decision — governed recommendation"));
  const subjectType = asString(chamber?.subjectType, asString(fallbackDebate?.subjectType, "general"));
  const recommendation = asString(soul?.unifiedRecommendation, "Soul has not yet synthesized a unified recommendation.");
  const summary = asString(soul?.summary, "");
  const confidence = asNumber(soul?.confidence);
  const expectedProfit = asNumber(soul?.expectedProfitUsd);
  const expectedDays = asNumber(soul?.expectedTimeDays);
  const dissent = asArray(soul?.dissent).map((d) => asString(d)).filter((d) => d !== "—");

  return (
    <EmpirePageShell
      eyebrow="Governance · UX-013 · REAL-056"
      title="Soul Decision Chamber"
      description="Soul reduces the council to a single recommendation. Soul never executes — only the Grand King decides (DOCTRINE-005)."
      actions={
        <Link to={paths.dashboard.approvals} className="empireBtnPrimary">
          Defer to Grand King →
        </Link>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`Soul synthesized one recommendation on "${topic}" at ${confidence}% strength (${strengthLabel(confidence)}).`}
        why={summary || "Soul unifies the chiefs' positions into a single governed recommendation for the Grand King."}
        next="Review the single recommendation and its strength, then defer to the Grand King for the verdict."
        decision="Soul recommends only — send this to Approvals for the Grand King's decision."
        blocker={
          confidence < 45
            ? "Recommendation strength is weak — consider returning to debate before deferring."
            : "Soul recommendation ready for the Grand King."
        }
        action={{ label: "Defer to Grand King (Approvals)", to: paths.dashboard.approvals }}
      />

      <AlertBanner
        severity="info"
        title="Soul never executes (DOCTRINE-005)"
        message="The Soul Decision Chamber produces a single synthesized recommendation. No motion executes here — the Grand King authorizes every action in Approvals."
        action={{ label: "Defer to Grand King", to: paths.dashboard.approvals }}
      />

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard
          label="Recommendation strength"
          value={`${confidence}%`}
          source="REAL"
          health={strengthHealth(confidence)}
          hint={strengthLabel(confidence)}
          accent
        />
        <ExecutiveKpiCard
          label="Expected profit impact"
          value={formatCurrencyFromDollars(expectedProfit)}
          source="REAL"
          health="neutral"
          hint="If approved by the Grand King"
        />
        <ExecutiveKpiCard
          label="Expected time"
          value={`${expectedDays}d`}
          source="REAL"
          health="neutral"
          hint={`Subject: ${subjectType}`}
        />
      </ExecutiveKpiGrid>

      <ExecutivePanel
        title="Soul's Synthesized Recommendation"
        eyebrow="REAL-056 — one recommendation, never executed"
        variant="accent"
        actions={
          <Link to={paths.dashboard.approvals} className="empireBtnPrimary">
            Defer to Grand King →
          </Link>
        }
      >
        <p className={"empireCardBody"} style={{ fontSize: "1.0625rem", fontWeight: 600 }}>
          {recommendation}
        </p>
        {summary && <p className="empireMetricHint" style={{ marginTop: "0.5rem" }}>{summary}</p>}
        <span className="empireMetricHint" style={{ display: "block", marginTop: "0.75rem" }}>
          Strength {confidence}% ({strengthLabel(confidence)}) · expected {formatCurrencyFromDollars(expectedProfit)} · {expectedDays}d
        </span>
      </ExecutivePanel>

      <ExecutivePanel
        title="Recorded Dissent"
        eyebrow="Minority positions Soul carried forward"
        variant={dissent.length > 0 ? "default" : "muted"}
      >
        {dissent.length === 0 ? (
          <p className="empireCardBody">No dissent recorded — the council aligned behind Soul's recommendation.</p>
        ) : (
          <ul className="empireList">
            {dissent.map((d, i) => (
              <li key={i} className="empireListItem">{d}</li>
            ))}
          </ul>
        )}
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
