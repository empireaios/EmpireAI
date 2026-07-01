import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { HealthGrid, type HealthItem } from "@/components/empire/HealthGrid";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { fetchSuccess001CommandCenterDashboard } from "@/api/dashboard";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";
import { useCallback, useEffect, useState } from "react";
import styles from "./Success001CommandCenterPage.module.css";

export function Success001CommandCenterPage() {
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSuccess001CommandCenterDashboard();
      setDashboard(res.dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SUCCESS-001 unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState message="Loading SUCCESS-001 Command Center…" />;
  if (error || !dashboard) {
    return <ErrorState message={error ?? "SUCCESS-001 unavailable"} onRetry={() => void load()} />;
  }

  const progress = asNumber(dashboard.progressPercent);
  const healthItems: HealthItem[] = [
    { id: "business", label: "Business Health", status: asString(dashboard.businessHealth), detail: asString(dashboard.businessHealth) },
    { id: "empire", label: "Empire Health", status: asString(dashboard.empireHealth), detail: `${asNumber(dashboard.confidencePercent)}% confidence` },
    { id: "target", label: "SUCCESS-001", status: progress > 0 ? "IN_PROGRESS" : "BLOCKED", detail: `$${asNumber(dashboard.currentNetProfitUsd).toLocaleString()} / $${asNumber(dashboard.targetNetProfitUsd).toLocaleString()}` },
  ];

  const blockerSections = [
    { title: "Operational", items: asArray(dashboard.operationalBlockers) },
    { title: "Commercial", items: asArray(dashboard.commercialBlockers) },
    { title: "Supplier", items: asArray(dashboard.supplierBlockers) },
    { title: "Marketplace", items: asArray(dashboard.marketplaceBlockers) },
  ];

  const allBlockers = blockerSections
    .flatMap((section) => section.items.map((item) => asString(item)))
    .filter((item) => item !== "—");
  const topBlocker = allBlockers[0] ?? "No blocker detected — keep momentum.";
  const topRecommendation = asRecord(asArray(dashboard.executiveRecommendations)[0]);
  const approvalQueue = asArray(dashboard.grandKingApprovalQueue).map((q) => asRecord(q));

  return (
    <EmpirePageShell
      eyebrow="REAL-035 · Milestone MS-A"
      title="SUCCESS-001 Command Center"
      description="Milestone MS-A — first USD 100,000 cumulative net profit (Grand King account) — critical path"
      actions={
        <Link to={paths.dashboard.approvals} className="empireBtnSecondary">
          Approvals{approvalQueue.length > 0 ? ` (${approvalQueue.length})` : ""}
        </Link>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${progress}% toward $100K — ${asString(dashboard.currentNetProfitUsd) === "0" ? "no" : "$" + asNumber(dashboard.currentNetProfitUsd).toLocaleString()} net profit, ${asNumber(dashboard.distanceToTargetUsd).toLocaleString()} to go.`}
        why={asString(dashboard.soulRecommendation, "Soul synthesizes the council's view on the fastest path to net profit.")}
        next={
          topRecommendation
            ? asString(topRecommendation?.title, "Resolve the top blocker on the critical path.")
            : "Resolve the top blocker on the critical path."
        }
        decision={
          approvalQueue.length > 0
            ? `${approvalQueue.length} item(s) await your approval to advance the mission.`
            : "Clear the top blocker to unlock progress."
        }
        blocker={topBlocker}
        blockerTo={null}
        action={{ label: "Open Approvals", to: paths.dashboard.approvals }}
      />

      <div className={styles.success001Page}>
        <section className="empireCard">
          <p className="empireEyebrow">Net Profit Mission · SUCCESS-001</p>
          <div className={styles.hero}>
            <div className={styles.heroCell}>
              <span className="empireMetricLabel">Current Net Profit</span>
              <span className={styles.heroValue}>${asNumber(dashboard.currentNetProfitUsd).toLocaleString()}</span>
            </div>
            <div className={styles.heroCell}>
              <span className="empireMetricLabel">Monthly Profit</span>
              <span className={styles.heroValue}>${asNumber(dashboard.currentMonthlyProfitUsd).toLocaleString()}</span>
            </div>
            <div className={styles.heroCell}>
              <span className="empireMetricLabel">Distance to USD 100K</span>
              <span className={styles.heroValue}>${asNumber(dashboard.distanceToTargetUsd).toLocaleString()}</span>
            </div>
            <div className={styles.heroCell}>
              <span className="empireMetricLabel">Projected Arrival</span>
              <span className={styles.heroValue}>{asString(dashboard.projectedArrival)}</span>
            </div>
          </div>
          <div className={styles.progressBar} aria-hidden>
            <div className={styles.progressFill} style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <p className="empireMetricHint">{progress}% toward SUCCESS-001 · sustainable net profit (CONSTITUTION-030)</p>
        </section>

        <HealthGrid items={healthItems} title="Mission Health" />

        <div className={styles.soulBlock}>
          <span className="empireMetricLabel">Soul Recommendation</span>
          <p>{asString(dashboard.soulRecommendation)}</p>
        </div>

        <div className={styles.blockerGrid}>
          {blockerSections.map((section) => (
            <section key={section.title} className="empireCard">
              <span className="empireMetricLabel">{section.title} Blockers</span>
              <ul className={styles.blockerList}>
                {section.items.map((item, i) => (
                  <li key={i}>{asString(item)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="empireCard">
          <p className="empireEyebrow">MCL-001</p>
          <span className="empireMetricLabel">Programs Blocking SUCCESS-001</span>
          <ul className={styles.blockerList}>
            {asArray(dashboard.programsBlocking).slice(0, 8).map((p, i) => {
              const row = asRecord(p);
              return <li key={i}>{asString(row?.program)} — {asString(row?.nextMission)}</li>;
            })}
          </ul>
        </section>

        <section className="empireCard">
          <p className="empireEyebrow">REAL-034</p>
          <span className="empireMetricLabel">Executive Recommendations</span>
          <ul className={styles.blockerList}>
            {asArray(dashboard.executiveRecommendations).slice(0, 5).map((r, i) => {
              const row = asRecord(r);
              return <li key={i}><strong>{asString(row?.title)}</strong> — {asString(row?.evidence)}</li>;
            })}
          </ul>
        </section>

        <section className="empireCard">
          <p className="empireEyebrow">EC-011</p>
          <span className="empireMetricLabel">Grand King Approval Queue</span>
          <ul className={styles.blockerList}>
            {asArray(dashboard.grandKingApprovalQueue).map((q, i) => {
              const row = asRecord(q);
              return <li key={i}>{asString(row?.title)} — {asString(row?.reason)}</li>;
            })}
            {asArray(dashboard.grandKingApprovalQueue).length === 0 && (
              <li>No items awaiting Grand King approval</li>
            )}
          </ul>
        </section>
      </div>
    </EmpirePageShell>
  );
}
