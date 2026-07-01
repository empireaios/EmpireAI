import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { AlertBanner } from "@/components/system/AlertBanner";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchBillingPayments,
  fetchBillingRevenue,
  fetchBillingSettings,
  type BillingRevenueSummary,
  type BillingSettingsView,
} from "@/api/billing";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asNumber, asRecord, asString, formatCurrency } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

interface PaymentRow {
  id: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  customerEmail: string;
}

function formatPaymentDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleString();
}

export function BillingPage() {
  const { user } = useAuth();
  const { globalAdvertisingIntelligence, loading: adsLoading } = useEmpireDashboard();
  const [revenue, setRevenue] = useState<BillingRevenueSummary | null>(null);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [settings, setSettings] = useState<BillingSettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOperator = user?.role === "operator";
  const canAccess = user?.role === "founder" || user?.role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [revenueRes, paymentsRes, settingsRes] = await Promise.all([
        fetchBillingRevenue(GRAND_KING_COMPANY_ID),
        fetchBillingPayments(GRAND_KING_COMPANY_ID),
        fetchBillingSettings(GRAND_KING_COMPANY_ID),
      ]);
      setRevenue(revenueRes);
      setPayments(paymentsRes.payments);
      setSettings(settingsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing state");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) void load();
  }, [canAccess, load]);

  const adSummary = asRecord(globalAdvertisingIntelligence?.summary);
  const adSpendUsd = asNumber(adSummary?.totalSpendUsd ?? adSummary?.spendUsd);

  const workspace = settings?.workspace;
  const plan = asString(workspace?.plan, "Sovereign");
  const workspaceName = asString(workspace?.name, "Empire Holdings");

  const totalRevenueCents = revenue?.totalRevenueCents ?? 0;
  const totalPayments = revenue?.totalPayments ?? 0;
  const succeededPayments = revenue?.succeededPayments ?? 0;
  const currency = asString(revenue?.currency, "USD");

  const paymentRows = useMemo<PaymentRow[]>(
    () =>
      payments.map((raw) => {
        const p = asRecord(raw) ?? {};
        return {
          id: asString(p.paymentId, asString(p.id, "—")),
          provider: asString(p.provider, "—"),
          status: asString(p.status, "UNKNOWN"),
          amountCents: asNumber(p.amountCents),
          currency: asString(p.currency, currency),
          createdAt: asString(p.createdAt, "—"),
          customerEmail: asString(p.customerEmail, "—"),
        };
      }),
    [payments, currency],
  );

  const failedCount = paymentRows.filter((p) => p.status === "FAILED").length;
  const latestProvider = paymentRows.find((p) => p.status === "SUCCEEDED")?.provider ?? null;
  const paymentMethodLabel = latestProvider
    ? `${latestProvider} · active`
    : "No payment method on file";

  const paymentColumns: ExecutiveTableColumn<PaymentRow>[] = [
    { key: "id", header: "Payment ID", render: (row) => <code>{row.id.slice(0, 12)}…</code> },
    { key: "provider", header: "Provider", render: (row) => row.provider },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => formatCurrency(row.amountCents, row.currency),
    },
    { key: "date", header: "Date", render: (row) => formatPaymentDate(row.createdAt) },
    { key: "email", header: "Customer", render: (row) => row.customerEmail },
  ];

  if (isOperator || (user && !canAccess)) {
    return (
      <EmpirePageShell
        eyebrow="System · UX-022"
        title="Billing"
        description="Billing is restricted to founder and admin roles."
      >
        <ErrorState
          message="Access denied — Billing is founder/admin-gated. Operators do not have access to plan, payment method, or invoice data."
          onRetry={() => window.history.back()}
        />
      </EmpirePageShell>
    );
  }

  if (loading || adsLoading) return <LoadingState message="Loading billing state…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <EmpirePageShell
      eyebrow="Commercial Spine · UX-022 · Billing Module"
      title="Billing"
      description="Plan, payment method, invoices, and ad spend — live state from the billing module (live-payments + settings)."
      actions={
        <>
          <Link to={paths.dashboard.settings} className="empireBtnSecondary">
            Empire Settings
          </Link>
          <Link to={paths.dashboard.advertising} className="empireBtnSecondary">
            Ad spend detail →
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${workspaceName} on ${plan} plan · ${succeededPayments}/${totalPayments} payments succeeded · ${formatCurrency(totalRevenueCents, currency)} collected.`}
        why="Billing state must reflect the live payment ledger — no mocked invoices or static plan labels."
        next={
          failedCount > 0
            ? "Resolve failed payments before scaling ad spend or launching new brands."
            : "Review payment history and ad spend summary; manage account details in Empire Settings."
        }
        decision="No Grand King approval required on this screen — billing is observational."
        blocker={
          failedCount > 0
            ? `${failedCount} failed payment(s) — review invoices below.`
            : "Billing module connected."
        }
      />

      {failedCount > 0 && (
        <AlertBanner
          severity="critical"
          title="Payment failed"
          message={`${failedCount} payment(s) in FAILED status. Review invoices and update payment method via Infrastructure → Payments if needed.`}
          action={{ label: "Infrastructure · Payments", to: paths.dashboard.infrastructurePayments }}
        />
      )}

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard label="Plan" value={plan} hint={workspaceName} health="neutral" />
        <ExecutiveKpiCard
          label="Payment method"
          value={paymentMethodLabel}
          hint={latestProvider ? "From live-payments ledger" : "Configure in Infrastructure"}
          health={latestProvider ? "ok" : "warning"}
        />
        <ExecutiveKpiCard
          label="Collected revenue"
          value={formatCurrency(totalRevenueCents, currency)}
          hint={`${succeededPayments} succeeded`}
          health={succeededPayments > 0 ? "ok" : "neutral"}
        />
        <ExecutiveKpiCard
          label="Ad spend (summary)"
          value={adSpendUsd > 0 ? `$${Math.round(adSpendUsd).toLocaleString()}` : "—"}
          hint="From advertising intelligence · REAL-038"
          health="neutral"
        />
      </ExecutiveKpiGrid>

      <ExecutivePanel title="Payment History" eyebrow="live-payments · billing module">
        {paymentRows.length === 0 ? (
          <p className="empireCardBody">No payments recorded yet — checkout sessions appear here when processed.</p>
        ) : (
          <ExecutiveTable columns={paymentColumns} rows={paymentRows} getRowKey={(row) => row.id} />
        )}
      </ExecutivePanel>

      <ExecutivePanel title="Account & Links" eyebrow="Commercial spine">
        <p className="empireCardBody">
          Workspace plan: <strong>{plan}</strong> · Total payments: <strong>{totalPayments}</strong> · Ledger
          Ledger sales: <strong>{revenue?.ledgerSaleCount ?? 0}</strong>
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
          <Link to={paths.dashboard.settings} className="empireBtnSecondary">
            Empire Settings
          </Link>
          <Link to={paths.dashboard.advertising} className="empireBtnSecondary">
            Advertising (spend)
          </Link>
          <Link to={paths.dashboard.infrastructurePayments} className="empireBtnSecondary">
            Infrastructure · Payments
          </Link>
        </div>
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
