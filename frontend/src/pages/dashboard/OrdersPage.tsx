import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { MissionPanel } from "@/components/empire/MissionPanel";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { fetchOrderPipelines } from "@/api/orders";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asRecord, asString, asNumber } from "@/lib/empire-data";
import { buildMissionActions } from "@/lib/mission-engine";
import { paths } from "@/routes/paths";

const RETURNABLE = ["FULFILLMENT_REQUESTED", "IN_TRANSIT", "DELIVERED"];
const REFUND_ELIGIBLE = ["FAILED", "CANCELLED"];

interface OrderRow {
  id: string;
  status: string;
  revenueCents: number;
  currency: string;
  customer: string;
  fulfillment: string;
}

export function OrdersPage() {
  const [pipelines, setPipelines] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returnRequested, setReturnRequested] = useState<Record<string, true>>({});
  const empire = useEmpireDashboard();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { pipelines: data } = await fetchOrderPipelines();
      setPipelines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = useMemo<OrderRow[]>(() => {
    return pipelines.map((raw) => {
      const p = asRecord(raw) ?? {};
      const tracking = asString(p.trackingNumber, "Pending");
      const carrier = asString(p.carrier, "");
      const supplierOrderId = asString(p.supplierOrderId, "");
      const fulfillment = [tracking, carrier].filter((s) => s && s !== "Pending").join(" · ")
        || (supplierOrderId ? `Supplier ${supplierOrderId.slice(0, 8)}` : "Pending");
      return {
        id: asString(p.pipelineId),
        status: asString(p.status, "CHECKOUT_CREATED"),
        revenueCents: asNumber(p.revenueCents),
        currency: asString(p.currency, "USD"),
        customer: asString(p.customerName, asString(p.customerEmail, "—")),
        fulfillment,
      };
    });
  }, [pipelines]);

  const missions = buildMissionActions({
    dashboard: empire.dashboard,
    ofd: empire.ofd,
    brief: empire.brief,
    eyes: empire.eyes,
    executive: empire.executive,
  }).filter((m) => m.category === "operations");

  if (loading) return <LoadingState message="Loading commerce operations…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const inFlight = orders.filter((o) => !["DELIVERED", "FAILED", "CANCELLED"].includes(o.status)).length;
  const requestedReturns = orders.filter((o) => returnRequested[o.id]);

  function money(cents: number, currency: string) {
    return `$${(cents / 100).toFixed(2)} ${currency}`;
  }

  const columns: ExecutiveTableColumn<OrderRow>[] = [
    { key: "id", header: "Order", render: (row) => <strong>{row.id ? row.id.slice(0, 8) : "—"}</strong> },
    { key: "status", header: "Stage", render: (row) => <StatusBadge status={row.status} /> },
    { key: "revenue", header: "Revenue", align: "right", render: (row) => money(row.revenueCents, row.currency) },
    { key: "customer", header: "Customer", render: (row) => row.customer },
    { key: "fulfillment", header: "Fulfillment", render: (row) => row.fulfillment },
    {
      key: "pnl",
      header: "P&L",
      render: (row) =>
        row.id ? (
          <Link to={`${paths.dashboard.operatingCost}?order=${encodeURIComponent(row.id)}`} className="empireBtnSecondary">
            View P&L →
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "return",
      header: "Refund / Return",
      align: "right",
      render: (row) => {
        if (returnRequested[row.id]) {
          return <StatusBadge status="PENDING" label="Return requested" />;
        }
        if (REFUND_ELIGIBLE.includes(row.status)) {
          return <StatusBadge status="WARNING" label="Refund eligible" />;
        }
        if (RETURNABLE.includes(row.status) && row.id) {
          return (
            <button
              type="button"
              className="empireBtnSecondary"
              onClick={() => setReturnRequested((prev) => ({ ...prev, [row.id]: true }))}
            >
              Request return
            </button>
          );
        }
        return <span>—</span>;
      },
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Commercial Spine · UX-009 · REAL-037 / 039 / 040 / 041"
      title="Commerce Operations"
      description="Customer orders, fulfillment state, returns/refunds, and per-order profitability."
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${orders.length} order(s) in the pipeline · ${inFlight} still in fulfillment.`}
        why="Fulfillment SLA and return rate decide repeat revenue and the real margin per order."
        next={
          orders.length === 0
            ? "No orders yet — first real sale appears here from the customer order pipeline."
            : requestedReturns.length > 0
              ? "Take the requested return(s) through the refund path for Grand King approval."
              : "Track in-flight orders; open any order's P&L to verify true margin."
        }
        decision={
          requestedReturns.length > 0
            ? `${requestedReturns.length} return/refund(s) staged — money moves only after approval (REAL-041 + GC-02).`
            : "No refund decision pending."
        }
        blocker={inFlight > 0 ? `${inFlight} order(s) awaiting fulfillment completion.` : "No fulfillment blocking."}
      />

      <ExecutivePanel
        title="Order Pipeline"
        eyebrow="REAL-037 / 039 / 040 — orders, payment, fulfillment lifecycle"
      >
        <ExecutiveTable
          columns={columns}
          rows={orders}
          getRowKey={(row, index) => row.id || `order-${index}`}
          emptyMessage="No orders yet. First real sale will appear here from the customer order pipeline."
        />
      </ExecutivePanel>

      <ExecutivePanel
        title="Returns & Refunds (REAL-041)"
        eyebrow="Governed path — no ungated money move"
        variant={requestedReturns.length > 0 ? "accent" : "muted"}
      >
        {requestedReturns.length === 0 ? (
          <p className="empireCardBody">
            No returns requested. Use “Request return” on a delivered or in-transit order to open a refund;
            refunds require Grand King approval before any money moves.
          </p>
        ) : (
          <ul className="empireList">
            {requestedReturns.map((row) => (
              <li
                key={row.id}
                className="empireListItem"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <span>
                  <strong>{row.id.slice(0, 8)}</strong> · {money(row.revenueCents, row.currency)} return requested
                </span>
                <StatusBadge status="PENDING" label="Awaiting approval · execution gated" />
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>

      <MissionPanel missions={missions} title="Operations Missions" compact />
    </EmpirePageShell>
  );
}
