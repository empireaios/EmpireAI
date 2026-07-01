import { useMemo, useState } from "react";
import { HealthGrid } from "@/components/empire/HealthGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import styles from "./GlobalMarketplaceOperationsPanel.module.css";

type Props = {
  dashboard: Record<string, unknown> | null;
  executiveCouncil: Record<string, unknown> | null;
};

export function GlobalMarketplaceDistributionPanel({ dashboard, executiveCouncil }: Props) {
  const gmo = asRecord(executiveCouncil?.globalMarketplaceOperations);
  const data = dashboard ?? (gmo ? {
    worldOverview: {
      countriesActive: gmo.countriesActive,
      countriesReady: gmo.countriesReady,
      countriesBlocked: gmo.countriesBlocked,
      marketplacesConnected: gmo.marketplacesConnected,
      productsLive: gmo.productsLive,
      productsAwaitingApproval: gmo.productsAwaitingApproval,
      totalRevenueUsd: gmo.totalRevenueUsd,
      totalProfitUsd: gmo.totalProfitUsd,
    },
    nextRecommendedCountry: gmo.nextRecommendedCountry ? { countryName: gmo.nextRecommendedCountry } : null,
    topOpportunityCountries: gmo.topOpportunityCountry ? [{ countryName: gmo.topOpportunityCountry }] : [],
  } : null);

  if (!data) return null;

  const overview = asRecord(data.worldOverview);
  const healthItems = [
    { id: "active", label: "Countries Active", status: asNumber(overview?.countriesActive) > 0 ? "HEALTHY" : "WARNING", detail: `${asNumber(overview?.countriesActive)} active` },
    { id: "ready", label: "Countries Ready", status: "HEALTHY", detail: `${asNumber(overview?.countriesReady)} ready` },
    { id: "blocked", label: "Countries Blocked", status: asNumber(overview?.countriesBlocked) > 5 ? "WARNING" : "HEALTHY", detail: `${asNumber(overview?.countriesBlocked)} blocked` },
    { id: "mp", label: "Marketplaces", status: asNumber(overview?.marketplacesConnected) > 0 ? "HEALTHY" : "WARNING", detail: `${asNumber(overview?.marketplacesConnected)} connected` },
  ];

  const nextCountry = asRecord(data.nextRecommendedCountry);
  const topOpps = asArray(data.topOpportunityCountries).slice(0, 3);

  return (
    <section className="empireCard" style={{ marginBottom: "1rem" }}>
      <p className="empireEyebrow">Global Marketplace Distribution (REAL-009)</p>
      <p className="empireMetricHint">Country → Marketplace → Products → Performance → Executive Recommendations</p>
      <HealthGrid items={healthItems} title="World Overview" />
      <div className={styles.metricsRow}>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Products Live</span>
          <span className={styles.metricValue}>{asNumber(overview?.productsLive)}</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Awaiting Approval</span>
          <span className={styles.metricValue}>{asNumber(overview?.productsAwaitingApproval)}</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Revenue</span>
          <span className={styles.metricValue}>${asNumber(overview?.totalRevenueUsd).toLocaleString()}</span>
        </div>
        <div className={styles.metricCell}>
          <span className="empireMetricLabel">Profit</span>
          <span className={styles.metricValue}>${asNumber(overview?.totalProfitUsd).toLocaleString()}</span>
        </div>
      </div>
      {nextCountry && (
        <p className="empireMetricHint">
          Next recommended country: {asString(nextCountry.countryName)}
          {topOpps.length > 0 ? ` · Top opportunity: ${asString(asRecord(topOpps[0])?.countryName)}` : ""}
        </p>
      )}
    </section>
  );
}

export function CountryMarketplaceTabsPanel({ dashboard }: { dashboard: Record<string, unknown> | null }) {
  const countries = useMemo(
    () => asArray(dashboard?.countries).map((c) => asRecord(c)).filter(Boolean),
    [dashboard],
  );
  const [countryCode, setCountryCode] = useState(asString(countries[0]?.countryCode, "SG"));
  const country = countries.find((c) => asString(c?.countryCode) === countryCode) ?? countries[0];
  const tabs = asArray(country?.marketplaceTabs).map((t) => asRecord(t));
  const [tabId, setTabId] = useState(asString(tabs[0]?.marketplaceId, ""));

  const activeTab = tabs.find((t) => asString(t?.marketplaceId) === tabId) ?? tabs[0];
  const products = asArray(activeTab?.products).map((p) => asRecord(p));

  if (countries.length === 0) return null;

  return (
    <section className="empireCard" style={{ marginBottom: "1rem" }}>
      <p className="empireEyebrow">Country × Marketplace Performance (REAL-010)</p>
      <div className={styles.countryGrid}>
        {countries.slice(0, 12).map((c) => {
          const code = asString(c?.countryCode);
          return (
            <button
              key={code}
              type="button"
              className={`${styles.countryChip} ${code === countryCode ? styles.countryChipActive : ""}`}
              onClick={() => {
                setCountryCode(code);
                const firstTab = asArray(c?.marketplaceTabs).map((t) => asRecord(t))[0];
                setTabId(asString(firstTab?.marketplaceId));
              }}
            >
              <strong>{code}</strong>
              <span className="empireMetricHint" style={{ display: "block", margin: 0 }}>
                {asString(c?.countryName)} · {asNumber(c?.productsLive)} live
              </span>
            </button>
          );
        })}
      </div>

      {country && (
        <>
          <p className="empireMetricHint" style={{ marginTop: "0.75rem" }}>
            {asString(country.countryName)} — {asString(country.executiveRecommendation)}
          </p>
          <div className={styles.tabRow}>
            {tabs.map((tab) => {
              const id = asString(tab?.marketplaceId);
              return (
                <button
                  key={id}
                  type="button"
                  className={`${styles.tabBtn} ${id === tabId ? styles.tabBtnActive : ""}`}
                  onClick={() => setTabId(id)}
                >
                  {asString(tab?.marketplaceName)}
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeTab && (
        <>
          <div className={styles.metricsRow}>
            <div className={styles.metricCell}>
              <span className="empireMetricLabel">Live</span>
              <span className={styles.metricValue}>{asNumber(activeTab.productsLive)}</span>
            </div>
            <div className={styles.metricCell}>
              <span className="empireMetricLabel">Pending</span>
              <span className={styles.metricValue}>{asNumber(activeTab.productsPending)}</span>
            </div>
            <div className={styles.metricCell}>
              <span className="empireMetricLabel">Blocked</span>
              <span className={styles.metricValue}>{asNumber(activeTab.productsBlocked)}</span>
            </div>
            <div className={styles.metricCell}>
              <span className="empireMetricLabel">Revenue</span>
              <span className={styles.metricValue}>${asNumber(activeTab.revenueUsd).toLocaleString()}</span>
            </div>
            <div className={styles.metricCell}>
              <span className="empireMetricLabel">Conversion</span>
              <span className={styles.metricValue}>{asNumber(activeTab.conversionPercent)}%</span>
            </div>
          </div>
          <p className="empireMetricHint">
            <StatusBadge status={asString(activeTab.connectionStatus, "NOT_CONNECTED")} />
            {" · "}{asString(activeTab.executiveRecommendation)} · Next: {asString(activeTab.nextAction)}
          </p>
          {products.length > 0 && (
            <div className={styles.productList}>
              {products.slice(0, 5).map((p) => (
                <div key={asString(p?.productId)} className={styles.productRow}>
                  <strong>{asString(p?.title)}</strong>
                  <StatusBadge status={asString(p?.status, "PENDING")} />
                  <span className="empireMetricHint" style={{ display: "block" }}>
                    ${asNumber(p?.revenueUsd)} rev · {asNumber(p?.orders)} orders · {asString(p?.executiveRecommendation)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function GlobalDistributionDebatePanel({ debate }: { debate: Record<string, unknown> | null }) {
  if (!debate) return null;
  const chiefs = asArray(debate.chiefCards).map((c) => asRecord(c));
  const soul = asRecord(debate.soulRecommendation);
  const king = asRecord(debate.grandKingDecision);

  return (
    <section className="empireCard" style={{ marginBottom: "1rem" }}>
      <p className="empireEyebrow">Global Distribution Executive Debate (REAL-012)</p>
      <p className="empireMetricHint">{asString(debate.topic)}</p>
      {soul && (
        <p className="empireMetricHint">
          Soul: {asString(soul.unifiedRecommendation)} · Classification: {asString(soul.launchClassification)}
        </p>
      )}
      <div className={styles.countryGrid}>
        {chiefs.slice(0, 6).map((chief) => (
          <div key={asString(chief?.executiveId)} className={styles.productRow}>
            <strong>{asString(chief?.title)}</strong>
            <span className="empireMetricHint">{asNumber(chief?.confidence)}% · {asString(chief?.stance)}</span>
          </div>
        ))}
      </div>
      <div className={styles.kingActions}>
        <span className="empireMetricHint">Grand King:</span>
        <StatusBadge status={asString(king?.decision, "PENDING")} />
        <span className="empireMetricHint">Approve · Reject · Request Investigation (DOCTRINE-006)</span>
      </div>
    </section>
  );
}
