import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { AlertBanner } from "@/components/system/AlertBanner";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePillowPageContext } from "@/context/PillowCompanionContext";
import {
  connectIntegration,
  displayStatusLabel,
  fetchIntegrationsHubDashboard,
  productionStatusLabel,
  type IntegrationsHubDashboard,
  type IntegrationsHubItem,
} from "@/api/integrations-hub";
import { paths } from "@/routes/paths";
import styles from "./IntegrationsHubPage.module.css";

function IntegrationCard({
  item,
  onConnect,
  connecting,
}: {
  item: IntegrationsHubItem;
  onConnect: (id: string) => void;
  connecting: string | null;
}) {
  const showConnect = item.canConnect || item.canReconnect;
  const buttonLabel =
    item.displayStatus === "needs_reauth" || item.displayStatus === "error"
      ? "Reconnect"
      : "Connect";

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{item.displayName}</h3>
        <StatusBadge status={item.displayStatus} label={displayStatusLabel(item.displayStatus)} />
      </div>
      <p className={styles.meta}>{item.purpose}</p>
      <p className={styles.meta}>
        <strong>Why EmpireAI needs it:</strong> {item.whyEmpireNeedsIt}
      </p>
      {item.oneTimeSetup && <span className={styles.oneTime}>One-time setup</span>}
      <p className={styles.meta}>
        Production: {productionStatusLabel(item.productionStatus)}
      </p>
      <p className={styles.meta}>
        Last verification:{" "}
        {item.lastVerification ? new Date(item.lastVerification).toLocaleString() : "—"}
      </p>
      {item.restrictions.length > 0 && (
        <p className={styles.meta}>{item.restrictions[0]}</p>
      )}
      <div className={styles.actions}>
        {showConnect && (
          <button
            type="button"
            className="empireBtnPrimary"
            disabled={connecting === item.integrationId}
            onClick={() => onConnect(item.integrationId)}
          >
            {connecting === item.integrationId ? "Connecting…" : buttonLabel}
          </button>
        )}
        {item.connectKind === "env" && item.displayStatus === "not_connected" && (
          <span className={styles.meta}>Configure via backend environment</span>
        )}
        {item.documentationUrl && (
          <a
            href={item.documentationUrl}
            target="_blank"
            rel="noreferrer"
            className="empireBtnSecondary"
          >
            Docs
          </a>
        )}
      </div>
    </article>
  );
}

export function IntegrationsHubPage() {
  usePillowPageContext(
    useMemo(
      () => ({
        extensionId: "integrations-hub",
        workflow: "external-connectivity-onboarding",
      }),
      [],
    ),
  );

  const [dashboard, setDashboard] = useState<IntegrationsHubDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { dashboard: data } = await fetchIntegrationsHubDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Integrations Hub");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleConnect(integrationId: string) {
    setConnecting(integrationId);
    setConnectMessage(null);
    try {
      await connectIntegration(integrationId);
      setConnectMessage(`Connection initiated for ${integrationId}.`);
      await load();
    } catch (err) {
      setConnectMessage(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setConnecting(null);
    }
  }

  if (loading) return <LoadingState message="Loading Integrations Hub…" />;
  if (error || !dashboard) {
    return <ErrorState message={error ?? "Integrations Hub unavailable"} onRetry={() => void load()} />;
  }

  const { summary } = dashboard;

  return (
    <EmpirePageShell
      eyebrow="System · UX-024 · REAL-051A"
      title="EmpireAI Integrations Hub"
      description="Single source of truth for every external business connection — one-time Grand King onboarding; EmpireAI assumes operational responsibility after connect (Marketplace Autonomy Doctrine)."
      actions={
        <>
          <Link to={paths.dashboard.infrastructure} className="empireBtnSecondary">
            Infrastructure (ESIS)
          </Link>
          <Link to={paths.dashboard.home} className="empireBtnSecondary">
            Mission Home
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${summary.connected} of ${summary.total} integrations connected · ${summary.notConnected} not connected · ${summary.needsReauth} need re-auth.`}
        why="Grand King performs one-time legal onboarding only — EmpireAI executes publish, sync, fulfil, and monitor per REAL-051A after credentials are stored."
        next="Connect required marketplaces and suppliers; verify production status before go-live."
        decision="No product launch decision on this screen — connectivity preparation only."
        blocker={
          summary.error > 0
            ? `${summary.error} integration(s) in error state — reconnect required.`
            : summary.notConnected > 0
              ? `${summary.notConnected} integration(s) not connected.`
              : "All tracked integrations connected or planned."
        }
      />

      <AlertBanner
        severity="info"
        title="Founder one-time onboarding (REAL-051A)"
        message="Complete each third-party connection once. After verification, EmpireAI assumes operational execution subject to Grand King and Executive governance approvals."
      />

      {connectMessage && (
        <AlertBanner severity="info" title="Connection" message={connectMessage} />
      )}

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard label="Connected" value={String(summary.connected)} source="REAL" health="ok" accent />
        <ExecutiveKpiCard label="Not connected" value={String(summary.notConnected)} source="REAL" health="neutral" />
        <ExecutiveKpiCard label="Needs re-auth" value={String(summary.needsReauth)} source="REAL" health="warning" />
        <ExecutiveKpiCard label="Errors" value={String(summary.error)} source="REAL" health={summary.error > 0 ? "critical" : "ok"} />
      </ExecutiveKpiGrid>

      <div className={styles.grid}>
        {dashboard.categories.map((category) => (
          <section key={category.category} className={styles.categorySection}>
            <ExecutivePanel title={category.label} eyebrow={`Integrations · ${category.category}`}>
              <div className={styles.cards}>
                {category.integrations.map((item) => (
                  <IntegrationCard
                    key={item.integrationId}
                    item={item}
                    onConnect={handleConnect}
                    connecting={connecting}
                  />
                ))}
              </div>
            </ExecutivePanel>
          </section>
        ))}
      </div>
    </EmpirePageShell>
  );
}
