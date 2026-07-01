import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

interface SupplierRow {
  id: string;
  name: string;
  risk: string;
  reliability: number;
  leadTime: string;
  status: string;
}

interface RiskRow {
  id: string;
  title: string;
  severity: string;
  supplier: string;
}

export function SuppliersPage() {
  const { supplierIntelligence, loading, error, reload } = useEmpireDashboard();
  const [searchParams] = useSearchParams();
  const candidate = searchParams.get("candidate");
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [resolvedRisks, setResolvedRisks] = useState<Record<string, true>>({});

  const suppliers = useMemo<SupplierRow[]>(() => {
    const raw = [
      ...asArray(supplierIntelligence?.suppliers),
      ...asArray(supplierIntelligence?.supplierOptions),
      ...asArray(supplierIntelligence?.options),
      ...asArray(supplierIntelligence?.evaluatedSuppliers),
    ].map((s) => asRecord(s));
    return raw.map((s, i) => ({
      id: asString(s?.supplierId ?? s?.id ?? s?.name ?? `supplier-${i}`),
      name: asString(s?.name ?? s?.supplierName ?? s?.displayName ?? s?.supplierId, "Supplier"),
      risk: asString(s?.riskLevel ?? s?.risk ?? s?.riskRating, "UNKNOWN"),
      reliability: asNumber(s?.reliabilityScore ?? s?.reliability ?? s?.score),
      leadTime: asString(s?.leadTimeDays ?? s?.leadTime ?? s?.shippingDays, "—"),
      status: asString(s?.status, "EVALUATED"),
    }));
  }, [supplierIntelligence]);

  const risks = useMemo<RiskRow[]>(() => {
    const raw = [
      ...asArray(supplierIntelligence?.risks),
      ...asArray(supplierIntelligence?.flaggedRisks),
      ...asArray(supplierIntelligence?.riskFlags),
      ...asArray(supplierIntelligence?.alerts),
    ].map((r) => asRecord(r));
    return raw.map((r, i) => ({
      id: asString(r?.riskId ?? r?.id ?? `risk-${i}`),
      title: asString(r?.title ?? r?.message ?? r?.description ?? r?.risk, "Supplier risk"),
      severity: asString(r?.severity ?? r?.level ?? r?.riskLevel, "MEDIUM"),
      supplier: asString(r?.supplier ?? r?.supplierName ?? r?.supplierId, "—"),
    }));
  }, [supplierIntelligence]);

  const defaultPrimaryId = useMemo(() => {
    const flagged = suppliers.find(
      (s) => ["PRIMARY", "ACTIVE", "SELECTED"].includes(s.status.toUpperCase()),
    );
    return flagged?.id ?? suppliers[0]?.id ?? null;
  }, [suppliers]);

  if (loading) return <LoadingState message="Evaluating supplier options…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;

  const effectivePrimaryId = primaryId ?? defaultPrimaryId;
  const primary = suppliers.find((s) => s.id === effectivePrimaryId) ?? null;
  const openRisks = risks.filter((r) => !resolvedRisks[r.id]);
  const topRisk = openRisks[0];

  const columns: ExecutiveTableColumn<SupplierRow>[] = [
    { key: "name", header: "Supplier", render: (row) => <strong>{row.name}</strong> },
    { key: "risk", header: "Risk", render: (row) => <StatusBadge status={row.risk} /> },
    { key: "reliability", header: "Reliability", align: "right", render: (row) => `${row.reliability}%` },
    { key: "leadTime", header: "Lead time", align: "right", render: (row) => row.leadTime },
    {
      key: "action",
      header: "Decision",
      align: "right",
      render: (row) =>
        row.id === effectivePrimaryId ? (
          <StatusBadge status="ACTIVE" label="Primary · keep" />
        ) : (
          <button type="button" className="empireBtnSecondary" onClick={() => setPrimaryId(row.id)}>
            Switch to this
          </button>
        ),
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Commercial Spine · UX-006 · SUP / REAL-071"
      title="Supplier Intelligence"
      description="Compare supplier options, manage risk, and choose who fulfills the Empire's products."
      actions={
        <>
          <Link to={paths.dashboard.intelligence} className="empireBtnSecondary">
            Back to Product Discovery
          </Link>
          <Link to={paths.dashboard.marketplaces} className="empireBtnPrimary">
            Marketplace Intelligence →
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={
          candidate
            ? `Sourcing a supplier for candidate ${candidate}. ${suppliers.length} option(s) evaluated.`
            : `${suppliers.length} supplier option(s) evaluated · ${openRisks.length} open risk(s).`
        }
        why="Supplier choice drives margin accuracy, fulfillment SLA, and customer satisfaction (CBD-005/011)."
        next={
          openRisks.length > 0
            ? "Resolve flagged supplier risks, then confirm the primary supplier."
            : primary
              ? `Keep or switch the primary supplier (currently ${primary.name}).`
              : "Run supplier evaluation to populate options."
        }
        decision={
          primary
            ? `Confirm ${primary.name} as primary supplier, or switch to a stronger option.`
            : "Select a primary supplier to advance the candidate."
        }
        blocker={topRisk ? `${topRisk.severity} risk: ${topRisk.title}` : "No supplier risk blocking."}
      />

      <ExecutivePanel
        title="Supplier Options"
        eyebrow="SUP · REAL-015 — evaluate, never auto-launch (GVD-007)"
      >
        <ExecutiveTable
          columns={columns}
          rows={suppliers}
          getRowKey={(row) => row.id}
          emptyMessage="No supplier options yet. Supplier Intelligence evaluates options as discovery feeds candidates."
        />
      </ExecutivePanel>

      <ExecutivePanel
        title="Flagged Risks"
        eyebrow="Resolve before committing to a supplier"
        variant={openRisks.length > 0 ? "accent" : "muted"}
      >
        {openRisks.length === 0 ? (
          <p className="empireCardBody">
            {risks.length === 0
              ? "No supplier risks detected."
              : "All flagged supplier risks resolved this session."}
          </p>
        ) : (
          <ul className="empireList">
            {openRisks.map((risk) => (
              <li
                key={risk.id}
                className="empireListItem"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <span>
                  <strong>{risk.severity}</strong> · {risk.title}
                  {risk.supplier !== "—" ? ` (${risk.supplier})` : ""}
                </span>
                <button
                  type="button"
                  className="empireBtnSecondary"
                  onClick={() => setResolvedRisks((prev) => ({ ...prev, [risk.id]: true }))}
                >
                  Resolve
                </button>
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
