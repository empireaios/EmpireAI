import { HealthGrid } from "@/components/empire/HealthGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import styles from "./GlobalCommandCenterPanel.module.css";

type Props = {
  dashboard: Record<string, unknown> | null;
  executiveCouncil: Record<string, unknown> | null;
};

export function GlobalCommandCenterPanel({ dashboard, executiveCouncil }: Props) {
  const gcc = asRecord(executiveCouncil?.globalCommandCenter);
  const data = dashboard ?? (gcc ? {
    architecturePercent: gcc.architecturePercent,
    globalRevenueUsd: gcc.globalRevenueUsd,
    globalProfitUsd: gcc.globalProfitUsd,
    productWinners: Array(asNumber(gcc.productWinners)).fill(null),
    productsAtRisk: Array(asNumber(gcc.productsAtRisk)).fill(null),
    supplierHealthScore: gcc.supplierHealthScore,
    revenueImprovementProposals: Array(asNumber(gcc.improvementProposals)).fill(null),
    revenueOpportunityQueue: Array(asNumber(gcc.opportunitiesQueued)).fill(null),
    grandKingApprovalQueue: Array(asNumber(gcc.kingApprovalQueue)).fill(null),
    completionLedgerSummary: { successMissionProgressPercent: gcc.successMissionProgressPercent },
  } : null);

  if (!data) return null;

  const winners = asArray(data.productWinners);
  const atRisk = asArray(data.productsAtRisk);
  const proposals = asArray(data.revenueImprovementProposals);
  const opportunities = asArray(data.revenueOpportunityQueue);
  const kingQueue = asArray(data.grandKingApprovalQueue);
  const countryHeat = asArray(data.countryHeatMap).slice(0, 5);
  const mpHeat = asArray(data.marketplaceHeatMap).slice(0, 5);
  const awaitingLaunch = asArray(data.productsAwaitingLaunch);
  const awaitingImprovement = asArray(data.productsAwaitingImprovement);
  const archiveCandidates = asArray(data.productsRecommendedForArchive);
  const oar = asRecord(data.operationalAccess);
  const mcl = asRecord(data.completionLedgerSummary);

  const healthItems = [
    { id: "revenue", label: "Global Revenue", status: asNumber(data.globalRevenueUsd) > 0 ? "HEALTHY" : "WARNING", detail: `$${asNumber(data.globalRevenueUsd).toLocaleString()}` },
    { id: "profit", label: "Global Profit", status: asNumber(data.globalProfitUsd) > 0 ? "HEALTHY" : "WARNING", detail: `$${asNumber(data.globalProfitUsd).toLocaleString()}` },
    { id: "winners", label: "Product Winners", status: winners.length > 0 ? "HEALTHY" : "WARNING", detail: `${winners.length} scaling candidates` },
    { id: "risk", label: "Products At Risk", status: atRisk.length > 3 ? "WARNING" : "HEALTHY", detail: `${atRisk.length} need review` },
  ];

  return (
    <section className={`empireCard ${styles.root}`}>
      <p className="empireEyebrow">Global Command Center (REAL-018)</p>
      <p className="empireMetricHint">Operational HQ — observe, debate, recommend. Nothing executes without Grand King.</p>
      <HealthGrid items={healthItems} title="Live Commerce Intelligence" />

      <div className={styles.metricsRow}>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Supplier Health</span>
          <span className={styles.metricValue}>{asNumber(data.supplierHealthScore)}%</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Improvements</span>
          <span className={styles.metricValue}>{proposals.length}</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Opportunities</span>
          <span className={styles.metricValue}>{opportunities.length}</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">King Queue</span>
          <span className={styles.metricValue}>{kingQueue.length}</span>
        </div>
      </div>

      {asString(data.executiveMorningBrief) && (
        <div className={styles.briefBlock}>
          <span className="empireMetricLabel">Executive Morning Brief</span>
          <p className="empireMetricHint">{asString(data.executiveMorningBrief).slice(0, 240)}{(asString(data.executiveMorningBrief)?.length ?? 0) > 240 ? "…" : ""}</p>
        </div>
      )}

      {asString(data.soulRecommendation) && (
        <p className="empireMetricHint">
          Soul: {asString(data.soulRecommendation).slice(0, 160)}{(asString(data.soulRecommendation)?.length ?? 0) > 160 ? "…" : ""}
        </p>
      )}

      {(countryHeat.length > 0 || mpHeat.length > 0) && (
        <div className={styles.heatRow}>
          {countryHeat.length > 0 && (
            <div>
              <span className="empireMetricLabel">Country Heat Map</span>
              <ul className={styles.list}>
                {countryHeat.map((c, i) => {
                  const row = asRecord(c);
                  return (
                    <li key={i}>
                      {asString(row?.label)} · ${asNumber(row?.profitUsd).toLocaleString()} profit
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {mpHeat.length > 0 && (
            <div>
              <span className="empireMetricLabel">Marketplace Heat Map</span>
              <ul className={styles.list}>
                {mpHeat.map((m, i) => {
                  const row = asRecord(m);
                  return (
                    <li key={i}>
                      {asString(row?.label)} · ${asNumber(row?.revenueUsd).toLocaleString()} revenue
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {winners.length > 0 && (
        <div className={styles.queueBlock}>
          <span className="empireMetricLabel">Product Winners</span>
          <ul className={styles.list}>
            {winners.slice(0, 4).map((w, i) => {
              const row = asRecord(w);
              return (
                <li key={i}>
                  <StatusBadge status="HEALTHY" /> {asString(row?.title)?.slice(0, 50)} · {asString(row?.lifecycle)}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {atRisk.length > 0 && (
        <div className={styles.queueBlock}>
          <span className="empireMetricLabel">Products At Risk</span>
          <ul className={styles.list}>
            {atRisk.slice(0, 4).map((w, i) => {
              const row = asRecord(w);
              return (
                <li key={i}>
                  <StatusBadge status="WARNING" /> {asString(row?.title)?.slice(0, 50)} · {asString(row?.lifecycle)}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {proposals.length > 0 && (
        <div className={styles.queueBlock}>
          <span className="empireMetricLabel">Revenue Improvement Queue</span>
          <ul className={styles.list}>
            {proposals.slice(0, 3).map((p, i) => {
              const row = asRecord(p);
              return (
                <li key={i}>
                  {asString(row?.title)?.slice(0, 70)} · +${asNumber(row?.expectedProfitGainUsd)} profit est.
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className={styles.footerRow}>
        {awaitingLaunch.length > 0 && <span>Awaiting launch: {awaitingLaunch.length}</span>}
        {awaitingImprovement.length > 0 && <span>Awaiting improvement: {awaitingImprovement.length}</span>}
        {archiveCandidates.length > 0 && <span>Archive candidates: {archiveCandidates.length}</span>}
        {oar && <span>OAR: {asNumber(oar.connected)}/{asNumber(oar.totalPlatforms)} connected</span>}
        {mcl && <span>SUCCESS-001: {asNumber(mcl.successMissionProgressPercent)}%</span>}
        <span>Architecture: {asNumber(data.architecturePercent, 82)}%</span>
      </div>
    </section>
  );
}
