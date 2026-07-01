import { HealthGrid } from "@/components/empire/HealthGrid";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import styles from "./GlobalOperationalCommandCenterPanel.module.css";

type Props = {
  dashboard: Record<string, unknown> | null;
};

export function GlobalOperationalCommandCenterPanel({ dashboard }: Props) {
  if (!dashboard) return null;

  const ledger = asRecord(dashboard.completionLedgerSummary);
  const alerts = asArray(dashboard.alerts).slice(0, 4);
  const missions = asArray(dashboard.todaysMissions).slice(0, 4);
  const approvals = asArray(dashboard.approvals).slice(0, 4);

  const healthItems = [
    { id: "mode", label: "Ops Mode", status: asString(dashboard.operationsMode), detail: asString(dashboard.operationsMode) },
    { id: "profit", label: "Net Profit", status: asNumber(dashboard.profitUsd) >= 0 ? "HEALTHY" : "WARNING", detail: `$${asNumber(dashboard.profitUsd).toLocaleString()}` },
    { id: "oar", label: "OAR", status: asNumber(dashboard.oarConnected) > 0 ? "HEALTHY" : "BLOCKED", detail: `${asNumber(dashboard.oarConnected)}/${asNumber(dashboard.oarTotal)}` },
    { id: "live", label: "Live Products", status: asNumber(dashboard.productsLive) > 0 ? "HEALTHY" : "WARNING", detail: String(asNumber(dashboard.productsLive)) },
  ];

  return (
    <section className={`empireCard ${styles.root}`}>
      <p className="empireEyebrow">Empire Headquarters (REAL-037)</p>
      <p className="empireMetricHint">{asString(dashboard.morningBrief)}</p>
      <HealthGrid items={healthItems} title="Operational HQ" />
      <div className={styles.metricsRow}>
        <div><span className="empireMetricLabel">Revenue</span><br />${asNumber(dashboard.revenueUsd).toLocaleString()}/mo</div>
        <div><span className="empireMetricLabel">Countries</span><br />{asNumber(dashboard.countriesActive)}</div>
        <div><span className="empireMetricLabel">Marketplaces</span><br />{asNumber(dashboard.marketplacesConnected)}</div>
        <div><span className="empireMetricLabel">MCL Avg</span><br />{asNumber(ledger?.avgCompletion)}%</div>
      </div>
      <p className={styles.soul}>{asString(dashboard.soulRecommendation)}</p>
      {alerts.length > 0 && (
        <ul className={styles.list}>
          {alerts.map((a, i) => {
            const row = asRecord(a);
            return <li key={i}><strong>{asString(row?.severity)}</strong> — {asString(row?.message)}</li>;
          })}
        </ul>
      )}
      {missions.length > 0 && (
        <>
          <span className="empireMetricLabel">Today&apos;s Missions</span>
          <ul className={styles.list}>{missions.map((m, i) => <li key={i}>{asString(m)}</li>)}</ul>
        </>
      )}
      {approvals.length > 0 && (
        <>
          <span className="empireMetricLabel">Approvals</span>
          <ul className={styles.list}>
            {approvals.map((a, i) => {
              const row = asRecord(a);
              return <li key={i}>{asString(row?.title)}</li>;
            })}
          </ul>
        </>
      )}
    </section>
  );
}
