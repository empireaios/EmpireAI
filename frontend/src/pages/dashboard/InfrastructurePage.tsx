import { useEffect, useMemo, useState } from "react";
import { Link, Routes, Route, NavLink } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { AlertBanner } from "@/components/system/AlertBanner";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import {
  fetchMarketplaceConnections,
  fetchRealityIntegrationDashboard,
  fetchRealityProviders,
  startMarketplaceConnection,
} from "@/api/settings";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";
import styles from "./InfrastructurePage.module.css";

interface InspectorRow {
  id: string;
  inspector: string;
  state: string;
  score: number;
  summary: string;
}

function healthFromEsis(state: string): "ok" | "warning" | "critical" | "neutral" {
  if (state === "HEALTHY") return "ok";
  if (state === "WARNING") return "warning";
  if (state === "FAILED") return "critical";
  return "neutral";
}

function InfraTabs() {
  return (
    <nav className={styles.tabs}>
      <NavLink to="marketplaces" className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
        Marketplaces
      </NavLink>
      <NavLink to="suppliers" className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
        Suppliers
      </NavLink>
      <NavLink to="payments" className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
        Payments
      </NavLink>
    </nav>
  );
}

function MarketplaceInfra({ isAdmin }: { isAdmin: boolean }) {
  const [connections, setConnections] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { connections: data } = await fetchMarketplaceConnections();
      setConnections(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState message="Loading marketplaces…" />;

  return (
    <ExecutivePanel title="Marketplace Connections" eyebrow="Orchestration · marketplace-connection-engine">
      <table className="empireTable">
        <thead>
          <tr>
            <th>Marketplace</th>
            <th>Status</th>
            {isAdmin && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {connections.map((entry) => (
            <tr key={asString(entry.marketplaceId)}>
              <td>{asString(entry.displayName)}</td>
              <td>
                <StatusBadge status={asString(entry.status, "NOT_CONNECTED")} />
              </td>
              {isAdmin && (
                <td>
                  {asString(entry.status) === "NOT_CONNECTED" && (
                    <button
                      type="button"
                      className="empireBtnSecondary"
                      onClick={() => void startMarketplaceConnection(asString(entry.marketplaceId))}
                    >
                      Start connect
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!isAdmin && (
        <p className="empireMetricHint" style={{ marginTop: "var(--space-3)" }}>
          Connector actions are admin-gated — contact an admin to start a connection.
        </p>
      )}
    </ExecutivePanel>
  );
}

function SupplierInfra() {
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [providers, setProviders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [dash, registry] = await Promise.all([
        fetchRealityIntegrationDashboard(GRAND_KING_COMPANY_ID),
        fetchRealityProviders(),
      ]);
      setDashboard(dash);
      setProviders(Array.isArray(registry.providers) ? registry.providers : []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState message="Loading suppliers…" />;

  const supplierProviders = providers.filter((p) =>
    ["cj-dropshipping", "aliexpress", "zendrop", "spocket"].includes(asString(p.providerId)),
  );

  return (
    <ExecutivePanel title="Supplier Infrastructure" eyebrow="Reality integration · supplier providers">
      <p className="empireCardBody">Connected services: {asString(dashboard?.connectedServicesCount, "0")}</p>
      <table className="empireTable">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {supplierProviders.map((provider) => (
            <tr key={asString(provider.providerId)}>
              <td>{asString(provider.displayName, asString(provider.providerId))}</td>
              <td>
                <StatusBadge status={asString(provider.lifecycle, "DISCONNECTED")} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ExecutivePanel>
  );
}

function PaymentInfra() {
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setDashboard(await fetchRealityIntegrationDashboard(GRAND_KING_COMPANY_ID));
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState message="Loading payments…" />;

  const connected = asArray(dashboard?.connectedServices);

  return (
    <ExecutivePanel title="Payment Infrastructure" eyebrow="Reality integration · payment connectors">
      {connected.length === 0 ? (
        <p className="empireCardBody">
          Stripe not connected — start marketplace/supplier flows from Reality Integration vault.
        </p>
      ) : (
        <table className="empireTable">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {connected.map((entry) => {
              const service = asRecord(entry);
              return (
                <tr key={asString(service?.providerId)}>
                  <td>{asString(service?.providerId)}</td>
                  <td>
                    <StatusBadge status={asString(service?.lifecycle, "DISCONNECTED")} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </ExecutivePanel>
  );
}

export function InfrastructurePage() {
  const { user } = useAuth();
  const { esis, operationalAccessDashboard, loading, error, reload } = useEmpireDashboard();

  const isOperator = user?.role === "operator";
  const isAdmin = user?.role === "admin";

  const esisData = asRecord(esis);
  const systemHealth = asRecord(esisData?.systemHealth);
  const architectureHealth = asRecord(esisData?.architectureHealth);
  const commerceHealth = asRecord(esisData?.commerceHealth);
  const frontendHealth = asRecord(esisData?.frontendHealth);
  const backendHealth = asRecord(esisData?.backendHealth);
  const validationHealth = asRecord(esisData?.validationHealth);
  const productionReadiness = asRecord(esisData?.productionReadiness);

  const inspectorRows = useMemo<InspectorRow[]>(
    () =>
      [
        { id: "system", label: "System", data: systemHealth },
        { id: "architecture", label: "Architecture", data: architectureHealth },
        { id: "commerce", label: "Commerce", data: commerceHealth },
        { id: "frontend", label: "Frontend", data: frontendHealth },
        { id: "backend", label: "Backend", data: backendHealth },
        { id: "validation", label: "Validation (live inspectors)", data: validationHealth },
        { id: "production", label: "Production readiness", data: productionReadiness },
      ].map(({ id, label, data }) => ({
        id,
        inspector: label,
        state: asString(data?.state, "UNKNOWN"),
        score: asNumber(data?.score),
        summary: asString(data?.summary, "—"),
      })),
    [systemHealth, architectureHealth, commerceHealth, frontendHealth, backendHealth, validationHealth, productionReadiness],
  );

  const systemState = asString(systemHealth?.state, "UNKNOWN");
  const oaSummary = asRecord(operationalAccessDashboard?.summary);
  const connectedPlatforms = asNumber(oaSummary?.connected);
  const blockedPlatforms = asNumber(oaSummary?.blocked);

  if (isOperator) {
    return (
      <EmpirePageShell
        eyebrow="System · UX-020"
        title="Infrastructure"
        description="System infrastructure is restricted to admin and founder roles."
      >
        <ErrorState
          message="Access denied — Infrastructure is admin/founder-gated. Operators do not have access to system infrastructure controls."
          onRetry={() => window.history.back()}
        />
      </EmpirePageShell>
    );
  }

  if (loading) return <LoadingState message="Loading system infrastructure…" />;
  if (error && !esis) {
    return <ErrorState message={error ?? "Infrastructure unavailable"} onRetry={() => void reload()} />;
  }

  const inspectorColumns: ExecutiveTableColumn<InspectorRow>[] = [
    { key: "inspector", header: "Live inspector", render: (row) => <strong>{row.inspector}</strong> },
    { key: "state", header: "State", render: (row) => <StatusBadge status={row.state} /> },
    { key: "score", header: "Score", align: "right", render: (row) => row.score },
    { key: "summary", header: "Summary", render: (row) => row.summary },
  ];

  return (
    <EmpirePageShell
      eyebrow="System · UX-020 · ESIS"
      title="Infrastructure"
      description="System health from live ESIS inspectors — marketplaces, suppliers, and payment connectors. Connector actions are admin-gated."
      actions={
        <>
          <Link to={paths.dashboard.launch} className="empireBtnSecondary">
            Back to Launch Mission
          </Link>
          <Link to={paths.dashboard.settings} className="empireBtnSecondary">
            Empire Settings →
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`System health ${systemState} · ${connectedPlatforms} platform(s) connected · ${blockedPlatforms} blocked · ${inspectorRows.length} live ESIS inspectors reporting.`}
        why="Infrastructure must be visible and trustworthy — ESIS live inspectors surface real system, validation, and production readiness."
        next={
          isAdmin
            ? "Review inspector results and manage connector actions in the tabs below."
            : "Review system health — connector management requires admin role."
        }
        decision="No launch decision here — monitor health and resolve blocked connectors."
        blocker={
          blockedPlatforms > 0
            ? `${blockedPlatforms} platform(s) blocked — resolve before scaling launches.`
            : systemState === "FAILED"
              ? "System health FAILED — review ESIS inspectors."
              : "Infrastructure monitoring active."
        }
      />

      {!isAdmin && (
        <AlertBanner
          severity="info"
          title="Admin-gated connector actions (GC-01)"
          message="Founders can view system health and connector status. Starting marketplace connections and other infrastructure actions require the admin role."
        />
      )}

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard
          label="System health"
          value={systemState}
          source="REAL"
          health={healthFromEsis(systemState)}
          hint={asString(systemHealth?.summary, "ESIS live inspection")}
          accent
        />
        <ExecutiveKpiCard
          label="Validation"
          value={asString(validationHealth?.state, "UNKNOWN")}
          source="REAL"
          health={healthFromEsis(asString(validationHealth?.state, "UNKNOWN"))}
          hint={asString(validationHealth?.summary, "Live test/typecheck inspectors")}
        />
        <ExecutiveKpiCard
          label="Production readiness"
          value={asString(productionReadiness?.state, "UNKNOWN")}
          source="REAL"
          health={healthFromEsis(asString(productionReadiness?.state, "UNKNOWN"))}
          hint={asString(productionReadiness?.summary, "Build & blocker inspectors")}
        />
      </ExecutiveKpiGrid>

      <ExecutivePanel title="ESIS Live Inspectors" eyebrow="empire-self-inspection · orchestration + ESIS">
        <p className="empireCardBody" style={{ marginBottom: "var(--space-3)" }}>
          {asString(esisData?.summary, "Empire Self-Inspection System — live health from repository scanners and production inspectors.")}
        </p>
        <ExecutiveTable
          columns={inspectorColumns}
          rows={inspectorRows}
          getRowKey={(row) => row.id}
          emptyMessage="ESIS inspectors unavailable — reload to refresh live health."
        />
        {asString(esisData?.reviewTimestamp) !== "—" && (
          <p className="empireMetricHint" style={{ marginTop: "var(--space-3)" }}>
            Last inspection: {asString(esisData?.reviewTimestamp)}
            {asString(esisData?.lastReportPath) !== "—" ? ` · Report: ${asString(esisData?.lastReportPath)}` : ""}
          </p>
        )}
      </ExecutivePanel>

      <InfraTabs />
      <Routes>
        <Route index element={<MarketplaceInfra isAdmin={isAdmin} />} />
        <Route path="marketplaces" element={<MarketplaceInfra isAdmin={isAdmin} />} />
        <Route path="suppliers" element={<SupplierInfra />} />
        <Route path="payments" element={<PaymentInfra />} />
      </Routes>
    </EmpirePageShell>
  );
}
