import { HealthGrid } from "@/components/empire/HealthGrid";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import styles from "./GrandKingFinancialCommandCenterPanel.module.css";

type Props = {
  dashboard: Record<string, unknown> | null;
};

export function GrandKingFinancialCommandCenterPanel({ dashboard }: Props) {
  if (!dashboard) return null;

  const economics = asRecord(dashboard.economics);
  const profitTrend = asArray(dashboard.profitTrend);
  const byCountry = asArray(dashboard.revenueByCountry).slice(0, 4);
  const byMarketplace = asArray(dashboard.revenueByMarketplace).slice(0, 4);
  const recommendations = asArray(dashboard.executiveRecommendations).slice(0, 3);

  const healthItems = [
    { id: "revenue", label: "Revenue", status: asNumber(dashboard.revenueUsd) > 0 ? "HEALTHY" : "WARNING", detail: `$${asNumber(dashboard.revenueUsd).toLocaleString()}/mo est.` },
    { id: "profit", label: "Net Profit", status: asNumber(dashboard.profitUsd) >= 0 ? "HEALTHY" : "WARNING", detail: `$${asNumber(dashboard.profitUsd).toLocaleString()}` },
    { id: "costs", label: "Monthly Costs", status: "HEALTHY", detail: `$${asNumber(dashboard.costsUsd).toLocaleString()}` },
    { id: "margin", label: "Net Margin", status: asNumber(dashboard.netMarginPercent) > 20 ? "HEALTHY" : "WARNING", detail: `${asNumber(dashboard.netMarginPercent)}%` },
  ];

  return (
    <section className={`empireCard ${styles.root}`}>
      <p className="empireEyebrow">Grand King Financial Command Center (REAL-020)</p>
      <p className="empireMetricHint">Net profit before revenue vanity — CONSTITUTION-023</p>
      <HealthGrid items={healthItems} title="Financial HQ" />
      <div className={styles.metricsRow}>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Monthly Burn</span>
          <span className={styles.metricValue}>${asNumber(dashboard.monthlyBurnUsd).toLocaleString()}</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Forecast (90d)</span>
          <span className={styles.metricValue}>${asNumber(dashboard.forecastUsd).toLocaleString()}</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Gross Profit</span>
          <span className={styles.metricValue}>${asNumber(economics?.grossProfitUsd).toLocaleString()}</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">ROI</span>
          <span className={styles.metricValue}>{asNumber(economics?.roiPercent)}%</span>
        </div>
      </div>
      {profitTrend.length > 0 && (
        <p className="empireMetricHint">
          Profit trend: {profitTrend.map((t) => `${asString(asRecord(t)?.period)} $${asNumber(asRecord(t)?.profitUsd)}`).join(" → ")}
        </p>
      )}
      <div className={styles.splitRow}>
        {byCountry.length > 0 && (
          <div>
            <span className="empireMetricLabel">Revenue by Country</span>
            <ul className={styles.list}>
              {byCountry.map((c, i) => {
                const row = asRecord(c);
                return <li key={i}>{asString(row?.label)} · ${asNumber(row?.revenueUsd).toLocaleString()}</li>;
              })}
            </ul>
          </div>
        )}
        {byMarketplace.length > 0 && (
          <div>
            <span className="empireMetricLabel">Revenue by Marketplace</span>
            <ul className={styles.list}>
              {byMarketplace.map((m, i) => {
                const row = asRecord(m);
                return <li key={i}>{asString(row?.label)} · ${asNumber(row?.profitUsd).toLocaleString()} profit</li>;
              })}
            </ul>
          </div>
        )}
      </div>
      {recommendations.length > 0 && (
        <div className={styles.recBlock}>
          <span className="empireMetricLabel">Executive Recommendations</span>
          <ul className={styles.list}>
            {recommendations.map((r, i) => {
              const row = asRecord(r);
              return <li key={i}>{asString(row?.title)?.slice(0, 80)} (+${asNumber(row?.expectedProfitImpactUsd)})</li>;
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
