import { useMemo } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

interface ChiefRow {
  executiveId: string;
  title: string;
  role: string;
  domain: string;
  focus: string;
  certificationStatus: string;
  maturity: string;
  successRate: number | null;
}

function confidenceHealth(confidence: number): "ok" | "warning" | "critical" {
  if (confidence >= 70) return "ok";
  if (confidence >= 45) return "warning";
  return "critical";
}

export function AiTeamPage() {
  const { executiveCouncil, loading, error, reload } = useEmpireDashboard();

  const council = asRecord(executiveCouncil);
  const registry = asRecord(council?.executiveCouncil);
  const highest = asRecord(council?.highestConfidenceExecutive);

  // W-5: chiefs are rendered straight from the executive-council registry — adding a
  // new executive in the registry appears here with no code change.
  const chiefs = useMemo<ChiefRow[]>(
    () =>
      asArray(registry?.registeredExecutives)
        .map(asRecord)
        .map((exec) => {
          const successRate = exec?.successRate;
          return {
            executiveId: asString(exec?.executiveId, ""),
            title: asString(exec?.title, asString(exec?.role, "Executive")),
            role: asString(exec?.role, ""),
            domain: asString(exec?.domain, "").replace(/_/g, " "),
            focus: asArray(exec?.focusAreas).map((f) => asString(f)).filter((f) => f !== "—").join(", "),
            certificationStatus: asString(exec?.certificationStatus, "DRAFT"),
            maturity: asString(exec?.maturity, "EMERGING"),
            successRate: typeof successRate === "number" ? successRate : null,
          };
        }),
    [registry],
  );

  if (loading) return <LoadingState message="Assembling your AI executive team…" />;
  if (error && !executiveCouncil) {
    return <ErrorState message={error ?? "AI Team unavailable"} onRetry={() => void reload()} />;
  }

  const totalExecutives = asNumber(registry?.totalExecutives, chiefs.length);
  const activeExecutives = asNumber(
    registry?.activeExecutives,
    chiefs.filter((c) => c.certificationStatus === "ACTIVE" || c.certificationStatus === "EXPERIMENTAL").length,
  );
  const commercialConfidence = asNumber(council?.commercialConfidence);
  const topChiefTitle = asString(highest?.title, "");
  const topChiefConfidence = asNumber(highest?.confidence);

  const columns: ExecutiveTableColumn<ChiefRow>[] = [
    {
      key: "title",
      header: "Chief",
      render: (row) => (
        <span>
          <strong>{row.title}</strong>
          {row.role && <span className="empireMetricHint"> · {row.role}</span>}
        </span>
      ),
    },
    { key: "domain", header: "Domain", render: (row) => row.domain || <span className="empireMetricHint">—</span> },
    { key: "focus", header: "Focus", render: (row) => row.focus || <span className="empireMetricHint">—</span> },
    { key: "certificationStatus", header: "Status", render: (row) => <StatusBadge status={row.certificationStatus} /> },
    { key: "maturity", header: "Maturity", render: (row) => row.maturity },
    {
      key: "successRate",
      header: "Confidence",
      align: "right",
      render: (row) =>
        row.successRate === null ? <span className="empireMetricHint">—</span> : `${row.successRate}%`,
    },
    {
      key: "debate",
      header: "",
      align: "right",
      render: () => (
        <Link to={paths.dashboard.debate} className="empireBtnSecondary">
          In debate →
        </Link>
      ),
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Executive Council · UX-016 · REAL-031/032/033"
      title="AI Team"
      description="Your AI executive council — every chief advises, debates, and is held accountable. Executives advise; the Grand King decides (DOCTRINE-005)."
      actions={
        <Link to={paths.dashboard.debate} className="empireBtnPrimary">
          Go to Executive Debate →
        </Link>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${totalExecutives} AI chiefs are registered — ${activeExecutives} active and ready to advise.`}
        why="The council is the registry of intelligence behind every recommendation. New chiefs can be added to the registry and appear here automatically."
        next="Review your chiefs and their domains, then take any question to the Executive Debate."
        decision="No decision required here — the team advises; the Grand King decides in Approvals."
        blocker={
          activeExecutives === 0
            ? "No active chiefs — certify executives before convening a debate."
            : "Council ready — convene a debate when a decision is needed."
        }
        action={{ label: "Go to Executive Debate", to: paths.dashboard.debate }}
      />

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard
          label="Commercial confidence"
          value={`${commercialConfidence}%`}
          source="REAL"
          health={confidenceHealth(commercialConfidence)}
          hint="Council's confidence in the commercial plan"
          accent
        />
        <ExecutiveKpiCard
          label="Active chiefs"
          value={`${activeExecutives} / ${totalExecutives}`}
          source="REAL"
          health={activeExecutives > 0 ? "ok" : "warning"}
          hint="Certified and advising"
        />
        <ExecutiveKpiCard
          label="Highest-confidence chief"
          value={topChiefTitle || "—"}
          source="REAL"
          health="neutral"
          hint={topChiefTitle ? `${topChiefConfidence}% in latest debate` : "Convene a debate to rank chiefs"}
        />
      </ExecutiveKpiGrid>

      <ExecutivePanel
        title="Your AI Chiefs"
        eyebrow={`Executive-council registry · ${totalExecutives} chiefs (dynamic)`}
      >
        <ExecutiveTable
          columns={columns}
          rows={chiefs}
          getRowKey={(row, index) => row.executiveId || String(index)}
          emptyMessage="No chiefs registered yet — initialize the executive council."
        />
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
